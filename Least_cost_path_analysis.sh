#The following loop is for the least cost paths analysis

#Firstly it creates a series of random source and destination points using the provided R script
#Rasterizes the points to align with the pre-made cost raster using Orfeo toolbox command line tools
#Ensures that the raster projection is retained using GDAL
#Runs the least cost paths forwards and backwards using whitbox tools in Python (also provided)

for i in $(seq 1 50)
do
    #Creating random points in large habitat for cost analysis
    Rscript Creating_random_spatial_points.R

    #Converting the source and destination points to a raster
    otbcli_Rasterization \
        -im cost_raster.tif \
        -mode.binary.foreground 1 \
        -ram 40000 \
        -epsg 3112 \
        -in Source_points.shp \
        -out Source_points.tif

    otbcli_Rasterization \
        -im cost_raster.tif \
        -mode.binary.foreground 1 \
        -ram 40000 \
        -epsg 3112 \
        -in Destination_points.shp \
        -out Destination_points.tif

    #Warping to fix projections
    gdalwarp -t_srs EPSG:3112 -co NUM_THREADS=ALL_CPUS -co COMPRESS=DEFLATE Source_points.tif Source_points_warped.tif
    gdalwarp -t_srs EPSG:3112 -co NUM_THREADS=ALL_CPUS -co COMPRESS=DEFLATE Destination_points.tif Destination_points_warped.tif

    ##Running the cost-distance analysis
    python cost_distance_whitebox.py

    #Making a child folder to move output
    rm  Destination_points.tif \
        Source_points.tif

    #creating a directory and moving output files
    mkdir outputs"$i"
    mv Source_points* \
     Destination_points* \
     Distance_from_forest.tif \
     out_backlink.tif \
     out_accum.tif \
     cost_pathway.tif \
     cost_raster_reverse.tif \
     out_backlink_reverse.tif \
     out_accum_reverse.tif \
     cost_pathway_reverse.tif \
        outputs"$i"
done