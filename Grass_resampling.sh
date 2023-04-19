#!/bin/bash
# set base path
outDir=.

for myfile in *.tif; do
    # Set raster as variable
    raster=${outDir}/$myfile

    # Set a base name for the data. This is used to demonstrate that normal
    # BASH commands can be used in this process, along side GRASS
    rasterName=$( basename $raster | sed 's/.tif//g' )

    # Import raster data
    r.in.gdal input=$raster output=$rasterName --overwrite

    # Set region. IMPORTANT so GRASS knows where the data is located.
    # This region is set for the duration of the following commands
    g.region rast=$rasterName res=30.0

    # Creating the new raster and making the output
    perc90=${rasterName}_perc90
    r.resamp.stats input=$rasterName method="perc90" quantile=0.5 -n -w output=$perc90 --overwrite

    # Export a raster for viewing
    areaOut=${outDir}/${rasterName}_output.tif
    r.out.gdal input=$perc90 output=$areaOut
done

