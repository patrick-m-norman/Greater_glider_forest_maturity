#%%
# -*- coding: utf-8 -*-
"""
Created on Wed Aug 12 08:57:24 2020

@author: pat_n
"""
import os
import pkg_resources
import whitebox
import glob
import pandas as pd

abspath = os.path.realpath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

wbt = whitebox.WhiteboxTools()
print(wbt.version())
print(wbt.help())


print(dname)

#Forward 
source = dname + "/Source_points_warped.tif"

cost = dname + "/cost_raster.tif"
#print(las_files)
out_accum = dname + "/out_accum.tif"
out_backlink = dname + "/out_backlink.tif"
wbt.cost_distance(
    source, 
    cost, 
    out_accum, 
    out_backlink
)

destination = dname + "/Destination_points_warped.tif"
backlink = dname + "/out_backlink.tif"
output = dname + "/cost_pathway.tif"

wbt.cost_pathway(
    destination, 
    backlink, 
    output,
    zero_background=True
)

#Reverse
source2 = dname + "/Destination_points_warped.tif"

#print(las_files)
out_accum = dname + "/out_accum_reverse.tif"
out_backlink = dname + "/out_backlink_reverse.tif"
wbt.cost_distance(
    source2, 
    cost, 
    out_accum, 
    out_backlink
)

destination2 = dname + "/Source_points_warped.tif"
backlink = dname + "/out_backlink_reverse.tif"
output = dname + "/cost_pathway_reverse.tif"

wbt.cost_pathway(
    destination2, 
    backlink, 
    output,
    zero_background=True
)

