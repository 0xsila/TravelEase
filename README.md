- Adding Images to the cars,homes,hotels require changing the body type into multipart/form-data check create car in postman
- also when they are linking they need to know that the body type is form-data
- everything workd fine but i didn't check the authentification
- changed postman ports to 5000
- dont forget to clean the mongodb cluster the images exist in my local workspace only u can get images using [backend link]/[image link saved in each object -car -hotel -home]

** added Favorite **

- user (current user) can favorite other user (target user)
- getting the profile of the target user have two additional field
  -- isMyFavorite bool check if the current user already added target user to favorite .usefull when loading the target user profile
  -- favoriteCount give u the number of people who added target user to favorite
