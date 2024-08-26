import { MarkerData } from "@/types/MarkerData";

const dummyMarkers : MarkerData[] = [
    {
        id: '1',
        coordinates: {lat: 23.555, lng: 90.76335},
        properties: {
        title: 'Marker 1',
        description: 'This is marker 1.',
        },
    },
    {
        id: '2',
        coordinates: {lat: 23.35454, lng: 90.54657},
        properties: {
        title: 'Marker 2',
        description: 'This is marker 2.',
        },
    },
    {
        id: '3',
        coordinates: {lat: 23.6543, lng: 90.4345456},
        properties: {
        title: 'Marker 3',
        description: 'This is marker 3.',
        },
    },
];

export default dummyMarkers;