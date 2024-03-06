#!/bin/sh

echo "Waiting for MongoDB to start..."
./wait-for db:27017 

echo "Seeding the database..."
npm run seed 

echo "Starting the server..."
npm start 