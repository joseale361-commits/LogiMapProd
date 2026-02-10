'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

interface InventoryImportClientProps {
    slug: string;
}

// Types for the import process
interface ExcelRow {
    [key: string]: string | number;
}

interface MappedRow {
    productName: string;
    variantName: string;
    price: number;
    packUnits: number;
    stock: number;
    sku: string;
}

interface GroupedProduct {
    name: string;
    variants: MappedRow[];
}

interface ImportResult {
    success: boolean;
    message: string;
    productsCreated?: number;
    variantsCreated?: number;
    errors?: string[];
}

// Column mapping options
const COLUMN_OPTIONS = [
    { value: 'productName', label: 'Nombre Producto (Obligatorio)' },
    { value: 'variantName', label: 'Variante / Presentación (Opcional)' },
    { value: 'price', label: 'Precio (Obligatorio)' },
    { value: 'packUnits', label: 'Unidades por Caja (Opcional)' },
    { value: 'stock', label: 'Stock (Opcional)' },
    { value: 'sku', label: 'SKU (Opcional)' },
    { value: 'ignore', label: 'Ignorar' },
];

export default function InventoryImportClient({ slug }: InventoryImportClientProps) {
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rawData, setRawData] = useState<ExcelRow[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [groupedData, setGroupedData] = useState<GroupedProduct[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [isDragging, setIsDragging] = useState(false);

    // Handle file selection
    const handleFileSelect = useCallback((selectedFile: File) => {
        if (!selectedFile) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
            alert('Por favor selecciona un archivo Excel válido (.xlsx, .xls, .csv)');
            return;
        }

        setFile(selectedFile);
        readExcelFile(selectedFile);
    }, []);

    // Read Excel file using SheetJS
    const readExcelFile = async (file: File) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                alert('El archivo debe tener al menos una fila de encabezados y una fila de datos');
                return;
            }

            const headerRow = jsonData[0] as unknown as string[];
            const dataRows = jsonData.slice(1).map((row) => {
                const obj: ExcelRow = {};
                headerRow.forEach((header, index) => {
                    obj[header] = row[index] ?? '';
                });
                return obj;
            });

            setHeaders(headerRow);
            setRawData(dataRows);
            setStep('mapping');
        } catch (error) {
            console.error('Error reading Excel file:', error);
            alert('Error al leer el archivo. Por favor verifica que sea un archivo Excel válido.');
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFileSelect(droppedFile);
    };

    // Handle column mapping change
    const handleMappingChange = (excelColumn: string, targetField: string) => {
        setColumnMapping((prev) => ({
            ...prev,
            [excelColumn]: targetField,
        }));
    };

    // Validate mapping
    const validateMapping = (): boolean => {
        const hasProductName = Object.values(columnMapping).includes('productName');
        const hasPrice = Object.values(columnMapping).includes('price');
        return hasProductName && hasPrice;
    };

    // Process and group data
    const processData = () => {
        if (!validateMapping()) {
            alert('Debes mapear al menos las columnas de "Nombre Producto" y "Precio"');
            return;
        }

        const mappedRows: MappedRow[] = rawData.map((row) => {
            const mapped: MappedRow = {
                productName: '',
                variantName: 'Unidad',
                price: 0,
                packUnits: 1,
                stock: 0,
                sku: '',
            };

            Object.entries(columnMapping).forEach(([excelColumn, targetField]) => {
                if (targetField === 'ignore') return;

                const value = row[excelColumn];
                switch (targetField) {
                    case 'productName':
                        mapped.productName = String(value || '').trim();
                        break;
                    case 'variantName':
                        mapped.variantName = String(value || 'Unidad').trim();
                        break;
                    case 'price':
                        mapped.price = parseFloat(String(value || '0')) || 0;
                        break;
                    case 'packUnits':
                        mapped.packUnits = parseInt(String(value || '1')) || 1;
                        break;
                    case 'stock':
                        mapped.stock = parseInt(String(value || '0')) || 0;
                        break;
                    case 'sku':
                        mapped.sku = String(value || '').trim();
                        break;
                }
            });

            return mapped;
        });

        // Group by product name
        const grouped: Record<string, MappedRow[]> = {};
        mappedRows.forEach((row) => {
            if (!row.productName) return;
            if (!grouped[row.productName]) {
                grouped[row.productName] = [];
            }
            grouped[row.productName].push(row);
        });

        const groupedProducts: GroupedProduct[] = Object.entries(grouped).map(([name, variants]) => ({
            name,
            variants,
        }));

        setGroupedData(groupedProducts);
        setStep('preview');
    };

    // Import data to server
    const handleImport = async () => {
        setStep('importing');
        setImportProgress({ current: 0, total: groupedData.length });

        try {
            const response = await fetch(`/api/dashboard/${slug}/inventory/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: groupedData,
                }),
            });

            const result: ImportResult = await response.json();

            if (response.ok) {
                setImportResult(result);
                setStep('complete');
            } else {
                setImportResult({
                    success: false,
                    message: result.message || 'Error al importar los datos',
                    errors: result.errors,
                });
                setStep('complete');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            setImportResult({
                success: false,
                message: 'Error de conexión al servidor',
            });
            setStep('complete');
        }
    };

    // Reset import
    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setHeaders([]);
        setRawData([]);
        setColumnMapping({});
        setGroupedData([]);
        setImportResult(null);
        setImportProgress({ current: 0, total: 0 });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Importar Inventario</h1>
                <p className="text-muted-foreground">
                    Importa productos y variantes desde un archivo Excel de forma inteligente
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-2">
                    {['upload', 'mapping', 'preview', 'complete'].map((s, index) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                                    ? 'bg-primary text-primary-foreground'
                                    : index < ['upload', 'mapping', 'preview', 'complete'].indexOf(step)
                                        ? 'bg-green-500 text-white'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {index + 1}
                            </div>
                            {index < 3 && (
                                <div
                                    className={`w-16 h-1 mx-2 ${index < ['upload', 'mapping', 'preview', 'complete'].indexOf(step)
                                        ? 'bg-green-500'
                                        : 'bg-muted'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Upload Step */}
            {step === 'upload' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Paso 1: Cargar Archivo</CardTitle>
                        <CardDescription>
                            Sube tu archivo Excel (.xlsx, .xls) o CSV con los datos de productos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-primary/50'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium mb-2">
                                Arrastra y suelta tu archivo aquí
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                o haz clic para seleccionar
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <Button asChild>
                                    <span>Seleccionar Archivo</span>
                                </Button>
                            </label>
                            <p className="text-xs text-muted-foreground mt-4">
                                Formatos aceptados: .xlsx, .xls, .csv
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mapping Step */}
            {step === 'mapping' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Paso 2: Mapear Columnas</CardTitle>
                        <CardDescription>
                            Relaciona las columnas de tu archivo con los campos del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {headers.map((header) => (
                                <div key={header} className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <Label className="font-medium">{header}</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Columna del archivo Excel
                                        </p>
                                    </div>
                                    <ArrowRight className="text-muted-foreground" />
                                    <div className="flex-1">
                                        <Select
                                            value={columnMapping[header] || 'ignore'}
                                            onValueChange={(value) => handleMappingChange(header, value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona campo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COLUMN_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-6">
                            <Button variant="outline" onClick={handleReset}>
                                Cancelar
                            </Button>
                            <Button onClick={processData}>
                                Continuar
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Paso 3: Vista Previa</CardTitle>
                        <CardDescription>
                            Revisa los datos agrupados antes de importar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-y-auto max-h-96 space-y-4">
                            {groupedData.map((product, index) => (
                                <div key={index} className="border rounded-lg">
                                    <div className="p-4 bg-muted/50 font-medium flex items-center justify-between">
                                        <span>{product.name}</span>
                                        <Badge variant="outline">{product.variants.length} variantes</Badge>
                                    </div>
                                    <div className="divide-y">
                                        {product.variants.map((variant, vIndex) => (
                                            <div key={vIndex} className="p-4 pl-8 flex items-center justify-between text-sm">
                                                <div>
                                                    <span className="font-medium">{variant.variantName}</span>
                                                    {variant.sku && (
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            SKU: {variant.sku}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-x-6">
                                                    <span>${variant.price.toLocaleString()}</span>
                                                    <span className="text-muted-foreground">
                                                        {variant.packUnits} u/c
                                                    </span>
                                                    <span className={variant.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                                        Stock: {variant.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-6">
                            <Button variant="outline" onClick={() => setStep('mapping')}>
                                Atrás
                            </Button>
                            <Button onClick={handleImport}>
                                Importar Todo
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Importing Step */}
            {step === 'importing' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Importando Datos</CardTitle>
                        <CardDescription>
                            Procesando {groupedData.length} productos...
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-lg font-medium mb-2">
                                    Procesando {importProgress.current} de {importProgress.total}...
                                </p>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(importProgress.current / importProgress.total) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Complete Step */}
            {step === 'complete' && importResult && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            {importResult.success ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-500" />
                            )}
                            <div>
                                <CardTitle>
                                    {importResult.success ? 'Importación Completada' : 'Error en la Importación'}
                                </CardTitle>
                                <CardDescription>{importResult.message}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {importResult.success && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Productos Creados</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {importResult.productsCreated}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Variantes Creadas</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {importResult.variantsCreated}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {importResult.errors && importResult.errors.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                                <p className="font-medium mb-2">Errores:</p>
                                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                                    {importResult.errors.map((error, index) => (
                                        <li key={index}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex justify-between mt-6">
                            <Button variant="outline" onClick={handleReset}>
                                Importar Otro Archivo
                            </Button>
                            {importResult.success && (
                                <Button asChild>
                                    <a href={`/dashboard/${slug}/products`}>Ver Productos</a>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
