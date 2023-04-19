#USING PDAL AND GDAL TO QUICKLY CREATE A TREE HEIGHT RASTER FROM POINT CLOUD DATA SOURCED FROM ELVIS 

#Getting every file out of the point cloud folder downloaded from ELVIS
find . -mindepth 3 -name '*' -type f -print -exec mv --backup=numbered {} . \;
#Unzipping all of the additional files into the parent folder
unzip '*.zip'

#Opening up the shell in a conda environment containing the pdal program
eval "$(conda shell.bash hook)"
conda activate pdal_trials

#Having a go at looping throug each laz
#Creating three folders
mkdir DTM DSM Tree_heights

#Create a terrain and surface model tif for each point cloud in parallel and put the output in the relavent folders
basename -s.laz ./*.laz | xargs -n1 -P20 \
    -I % pdal pipeline pipeline_DTM.json \
    --readers.las.filename=%.laz \
    --writers.gdal.filename=./DTM/%.tif


basename -s.laz ./*.laz | xargs -n1 -P20 \
    -I % pdal pipeline pipeline_DSM.json \
    --readers.las.filename=%.laz \
    --writers.gdal.filename=./DSM/%.tif

#Now deactivate the conda environment and opening up a gdal environment
conda deactive
eval "$(conda shell.bash hook)"
conda activate gdal_env

#Using gdal to subtract the DTM from the DSM
basename -s.tif ./DTM/*.tif | xargs -n1 -P20 -I % gdal_calc.py -A ./DSM/%.tif -B ./DTM/%.tif --co=COMPRESS=DEFLATE --co=NUM_THREADS=ALL_CPUS --outfile=./Tree_heights/%Tree_heights.tif --calc="A-B"

#merging each of the tifs together. If you have many overlapping tiles, it will take the last file.
gdal_merge.py -a_nodata -999 \
    -o Tree_heights_for_all_tiles.tif -co NUM_THREADS=ALL_CPUS ./Tree_heights/*.tif

##merging each of the tifs together. If you have many overlapping tiles, it will take the last file.
#gdal_merge.py -a_nodata -999 \
#    -o Tree_heights_for_SunshineCoast_2014.tif -co NUM_THREADS=ALL_CPUS ./Tree_heights/SunshineCoast_2014*.tif