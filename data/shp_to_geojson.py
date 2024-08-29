import geopandas as gpd

def shp2geojson(shp_path, geojson_path=None):
    """
    Convert SHP files to GeoJSON with geopandas.
    Outputs JSON file to same directory as the SHP files.

    Input:
    - shp_path (str):
        e.g. "/path/to/your/shapefile.shp"
    """
    
    # Read the shapefile
    gdf = gpd.read_file(shp_path)

    # If no geojson_path is provided, create one
    if not geojson_path:
        geojson_path = shp_path.replace('.shp', '.geojson')

    # Write to GeoJSON
    gdf.to_file(geojson_path, driver='GeoJSON')
      
# # Example usage
# shp2geojson('/path/to/your/shapefile.shp')