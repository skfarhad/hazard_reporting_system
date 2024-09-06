import { LngLatLike } from "mapbox-gl";

export interface MarkerData {
    id: string;
    coordinates: LngLatLike; // [longitude, latitude]
    properties: {
      title: string;
      description: string;
      [key: string]: any; // Optional additional properties
    };
  }
  