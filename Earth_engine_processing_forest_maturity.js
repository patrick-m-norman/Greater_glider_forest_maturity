//The following script was used to produce the US forest maturity clustering using Google Earth Engine 
//In total, five additional datasets were required as inputs:
//GLOBAL
//Tree cover - ee.Image("UMD/hansen/global_forest_change_2020_v1_8")
//Tree height - ee.ImageCollection("users/potapovpeter/GEDI_V27")
//Above ground living biomass sourced from https://globbiomass.org/products/global-mapping/

//AUS
//IBRA bioregions sourced from http://www.environment.gov.au/fed/catalog/search/resource/details.page?uuid=%7B4A2321F0-DD57-454E-BE34-6FD4BDE64703%7D
//Forest types sourced from https://www.agriculture.gov.au/abares/forestsaustralia/forest-data-maps-and-tools/spatial-data/forest-cover

//The only additional data included was a raster template for exporting and a list of all the forest type groups per ecoregions, which is
//publicly available as the asset ee.FeatureCollection("users/patrickmnorman/Forest_and_ecoregion_for_GEE_table")

//----------------------------------------------------------------------------------------------------------------------------------------
//Loading in each of the datasets
var gedi = ee.ImageCollection("users/potapovpeter/GEDI_V27"),
    export_area = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[116.70161850633441, -19.728810143698297],
          [113.66119740484936, -21.459346944160927],
          [112.1642649907094, -24.810025482398984],
          [114.3615306157094, -31.619103202948683],
          [113.9220774907094, -34.56389326670982],
          [115.7677806157094, -36.21179563343199],
          [122.3595774907094, -35.35622080900835],
          [127.3693431157094, -33.544465273301675],
          [130.3576243657094, -32.80884122034501],
          [133.6974681157094, -34.055711738961186],
          [137.1252024907094, -37.825712496827514],
          [141.0802806157094, -39.13291800660655],
          [142.9259837407094, -41.082128175348416],
          [144.8595774907094, -43.868874044092024],
          [148.3752024907094, -44.24783810798915],
          [149.8693431157094, -42.71743899152758],
          [151.8029368657094, -36.63611843651047],
          [154.7033274907094, -30.413958985203408],
          [155.4943431157094, -25.92183966659267],
          [151.4513743657094, -21.987217615452696],
          [147.0568431157094, -17.18629870273575],
          [144.2443431157094, -11.827947396768474],
          [143.3654368657094, -10.102297135105733],
          [143.3394543713723, -9.08733312568521],
          [143.2076184338723, -9.08733312568521],
          [142.7022473401223, -9.32591853793076],
          [142.3287121838723, -9.347600096624264],
          [142.2408215588723, -9.206645960442685],
          [142.0210949963723, -9.239178858851941],
          [141.68189211551294, -9.336759485897932],
          [141.4539258069192, -10.350197939452377],
          [140.7123486584817, -14.618285540966419],
          [137.3285595959817, -14.830795919370253],
          [137.7460400647317, -13.3176173144939],
          [137.9877392834817, -11.192025616292437],
          [136.2079541272317, -10.285345898929839],
          [131.9013135022317, -9.787710238961479],
          [128.9350049084817, -12.353568166327127],
          [128.6493603772317, -13.531340101506007],
          [126.29828615848169, -13.493952371915379],
          [121.51923342410669, -15.133262295981094],
          [118.39911623660669, -17.127814753685826]]]),
    biomass = ee.Image("users/patrickmnorman/GER_layers/Globbiomass_australia"),
    forest_groups = ee.Image("users/patrickmnorman/GER_layers/Forests_of_AUS_correct_values"),
    gfc = ee.Image("UMD/hansen/global_forest_change_2021_v1_9"),
    forests_x_IBRAreg = ee.FeatureCollection("users/patrickmnorman/GER_layers/Forests_x_IBRAreg_w_details"),
    IBRAreg = ee.FeatureCollection("users/patrickmnorman/GER_layers/IBRA_regs");


//Loading in each of the indices used for clustering

var forest_cover_projections = Tree_cover.select(['treecover2000']);
var biomass = Above_ground_biomass.select(['b1']);
var height = Tree_height.toBands().select(['GEDI_NAM_v27_b1']);

//Getting the projection and resolution details about the cover dataset to then merge the three datasets
var CoverProjection = forest_cover_projections.projection();
var CoverRes = forest_cover_projections.projection().nominalScale().getInfo()

//Aligning the three datasets to tree cover
var forest_groupRescaled = forest_groups
      // Force the next reprojection to aggregate instead of resampling.
    .reduceResolution({
      reducer: ee.Reducer.mode(),
      maxPixels: 65535
    })
    // Request the data at the scale and projection of the height image
    .reproject({
      crs: CoverProjection,
      scale: CoverRes
    });


var BiomassRescaled = biomass
    .reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 65535
    })
    .reproject({
      crs: CoverProjection,
      scale: CoverRes
    });
    
var HeightRescaled = height
    .reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 65535
    })
    .reproject({
      crs: CoverProjection,
      scale: CoverRes
    });
    


//The function below loops through the forest by ecoregion table supplied .
var polygons = ee.List(forests_x_IBRAreg.aggregate_array('id').sort()).slice(1,1938,1)/*list_subset*/.map(function(n) {
    var table_row = ee.Feature(forests_x_IBRAreg.filterMetadata('id', 'equals', n).first())
    var forest_type = ee.Number(table_row.get('Forest_type_ID'))
    var ecoregion = table_row.get('REG_ID')
    var ecoregion_poly = IBRAreg.filterMetadata('REC_ID', 'equals', ecoregion);
    var forest_group_clip = forest_groupRescaled.clip(ecoregion_poly)
    
    //Masking each of the input metrics to the forest type group by bioregion
    var forest_cover_clip = forest_cover_projections.updateMask(forest_group_clip.eq(forest_type)).clip(ecoregion_poly);
    var BiomassRescaled_clip = BiomassRescaled.updateMask(forest_group_clip.eq(forest_type)).clip(ecoregion_poly);
    var HeightRescaled_clip = HeightRescaled.updateMask(forest_group_clip.eq(forest_type)).clip(ecoregion_poly);
    
    //Generating the 0th, 25th, 50th, 75th and 100th percentiles for tree cover, tree heigh and above groud biomass layers
    var CoverPercentiles = forest_cover_clip.reduceRegion({
      reducer: ee.Reducer.percentile([0,25,50,75,100]), 
      geometry: ecoregion_poly,
      scale: CoverRes,
      maxPixels: 1e13
    });

    var BiomassPercentiles = BiomassRescaled_clip.reduceRegion({
      reducer: ee.Reducer.percentile([0,25,50,75,100]),
      geometry: ecoregion_poly,
      scale: CoverRes,
      maxPixels: 1e13
      });
    var heightPercentiles = HeightRescaled_clip.reduceRegion({
      reducer: ee.Reducer.percentile([0,25,50,75,100]),
      geometry: ecoregion_poly,
      scale: CoverRes,
      maxPixels: 1e13
      });
      
    //Providing a score for each of the quartiles. 1 = below 25%, 2 = between 25% and 50%, 3 = between 50% and 75% and 4 = above 75%
    var Forest_cover_classq = forest_cover_clip
                            .where(forest_cover_clip.gte(ee.Number(CoverPercentiles.get('treecover2000_p0'))).and(forest_cover_clip.lt(ee.Number(CoverPercentiles.get('treecover2000_p25')))), 1)
                            .where(forest_cover_clip.gte(ee.Number(CoverPercentiles.get('treecover2000_p25'))).and(forest_cover_clip.lt(ee.Number(CoverPercentiles.get('treecover2000_p50')))), 2)
                            .where(forest_cover_clip.gte(ee.Number(CoverPercentiles.get('treecover2000_p50'))).and(forest_cover_clip.lt(ee.Number(CoverPercentiles.get('treecover2000_p75')))), 3)
                            .where(forest_cover_clip.gte(ee.Number(CoverPercentiles.get('treecover2000_p75'))), 4)
                            
    var Biomas_classq = BiomassRescaled_clip
                            .where(BiomassRescaled_clip.gte(ee.Number(BiomassPercentiles.get('b1_p0'))).and(BiomassRescaled_clip.lt(ee.Number(BiomassPercentiles.get('b1_p25')))), 1)
                            .where(BiomassRescaled_clip.gte(ee.Number(BiomassPercentiles.get('b1_p25'))).and(BiomassRescaled_clip.lt(ee.Number(BiomassPercentiles.get('b1_p50')))), 2)
                            .where(BiomassRescaled_clip.gte(ee.Number(BiomassPercentiles.get('b1_p50'))).and(BiomassRescaled_clip.lt(ee.Number(BiomassPercentiles.get('b1_p75')))), 3)
                            .where(BiomassRescaled_clip.gte(ee.Number(BiomassPercentiles.get('b1_p75'))), 4)
                            
    var Height_classq = HeightRescaled_clip
                            .where(HeightRescaled_clip.gte(ee.Number(heightPercentiles.get('GEDI_NAM_v27_b1_p0'))).and(HeightRescaled_clip.lt(ee.Number(heightPercentiles.get('GEDI_NAM_v27_b1_p25')))), 1)
                            .where(HeightRescaled_clip.gte(ee.Number(heightPercentiles.get('GEDI_NAM_v27_b1_p25'))).and(HeightRescaled_clip.lt(ee.Number(heightPercentiles.get('GEDI_NAM_v27_b1_p50')))), 2)
                            .where(HeightRescaled_clip.gte(ee.Number(heightPercentiles.get('GEDI_NAM_v27_b1_p50'))).and(HeightRescaled_clip.lt(ee.Number(heightPercentiles.get('GEDI_NAM_v27_b1_p75')))), 3)
                            .where(HeightRescaled_clip.gte(ee.Number(heightPercentiles.get('GEDI_NAM_v27_b1_p75'))), 4)                       
  
    var output_layer = Forest_cover_classq.add(Biomas_classq).add(Height_classq);
    return output_layer
});

//Converting the image to an image collection
var collection = ee.ImageCollection(Maturity_cluster).toBands()
var combined = collection.reduce(ee.Reducer.mode()).toByte()

//Mapping colours to explore output
var vis = {min: 3, max: 12, palette: 'black,white'};
Map.addLayer(combined, vis, '')


//Exporting the image for further processing/
Export.image.toDrive({
  image: combined,
  description: 'Maturity_cluster_image',
  region: export_area,
  scale:30,
  maxPixels: 1e13
});//