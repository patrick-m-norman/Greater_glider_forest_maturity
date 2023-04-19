#Comparing the biomass values with the forest maturity ones
#setwd("/path")

library(rgeos)
library(sf)
library(exactextractr)
library(dplyr)
library(plyr)
library(data.table)
library(parallel)
library(ggplot2)
library(tidyr)
library(pastecs)
library(pgirmess)
library(car)

options(scipen=999)
ibra_names <- read.csv('IBRA_names.csv')

data <- read.csv('Sampled_points_for_validation_1M_w_data.csv') %>% 
  merge(., ibra_names, by.x= 'id_2', by.y='REC_ID') %>% 
  mutate(community_eco = paste(Name_long, REG_NAME_6))


#checking the most commonly sampled communities
amounts <- as.data.frame(table(data$community_eco))


#trialing some specific regions
Point_samples <- data %>% 
  filter(community_eco=='Acacia Medium Woodland Brigalow Belt North') %>% 
  mutate(y_axis = Height1) %>% 
  drop_na(Maturity1) %>% 
  filter(y_axis > 0) %>% 
  mutate(Maturity1 = as.factor(Maturity1))

kruskal.test(Height1 ~ Maturity1, data = NNSW_wet_euc)

# creating a rank variable
Point_samples$heightRank <- rank(NNSW_wet_euc$Height1)

# getting the descriptive statistics for the groups
by(Point_samples$heightRank, Point_samples$Maturity1, stat.desc, basic = FALSE)

# post-hoc test for identifying statistical significant differences between the groups
as.data.frame(kruskalmc(Height1 ~ Maturity1, data = Point_samples))

library(DescTools)
library(FSA)
library(PMCMRplus)

#Dunn's Kruskal-Wallis post-hoc test
posthocs2<-dunnTest(Height1 ~ Maturity1, data=Point_samples, method="holm")
print(posthocs2)

#Dwass, Steel, Critchlow, Fligner post-hoc test
posthocs3<-dscfAllPairsTest(Height1 ~ Maturity1, data=NNSW_wet_euc)
print(posthocs3)

