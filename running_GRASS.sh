#Creating the GRASS environment
#grass -c epsg:3577 -e GRASS_ENV

#running the grass script within that environment
grass GRASS_ENV/PERMANENT --exec sh Grass_resampling.sh