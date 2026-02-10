"use client"

import { Marker, useMapEvents } from 'react-leaflet';

interface DraggableMarkerProps {
    position: [number, number];
    onPositionChange: (pos: [number, number]) => void;
}

export function DraggableMarker({ position, onPositionChange }: DraggableMarkerProps) {
    const map = useMapEvents({
        click(e) {
            onPositionChange([e.latlng.lat, e.latlng.lng]);
        },
    });

    return (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend(e) {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    onPositionChange([pos.lat, pos.lng]);
                }
            }}
        />
    );
}
