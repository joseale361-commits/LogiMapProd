"use client"

import { Marker, useMapEvents } from 'react-leaflet';
import { useRef, useMemo } from 'react';
import L from 'leaflet';

interface DraggableMarkerProps {
    position: [number, number];
    onPositionChange: (pos: [number, number]) => void;
}

export function DraggableMarker({ position, onPositionChange }: DraggableMarkerProps) {
    const markerRef = useRef<L.Marker>(null);

    useMapEvents({
        click(e) {
            onPositionChange([e.latlng.lat, e.latlng.lng]);
        },
    });

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    const pos = marker.getLatLng();
                    onPositionChange([pos.lat, pos.lng]);
                }
            },
        }),
        [onPositionChange],
    );

    return (
        <Marker
            ref={markerRef}
            position={position}
            draggable={true}
            eventHandlers={eventHandlers}
        />
    );
}
