#!/bin/bash

# Path to the source HTML file and the destination file
HTML_FILE="index.html"
DEST_FILE="../firmware/EspWOL/index.h"

# Check if the HTML file exists
if [ ! -f "$HTML_FILE" ]; then
  echo "Error: $HTML_FILE not found."
  exit 1
fi

# Create the content of the destination file
{
  echo "// HTML content"
  echo "const char htmlPage[] PROGMEM = R\"rawliteral(";
  cat "$HTML_FILE"
  echo ")rawliteral\";";
} > "$DEST_FILE"

# Check if the destination file was created successfully
if [ $? -eq 0 ]; then
  echo "$DEST_FILE was successfully created."
else
  echo "Error: Failed to create $DEST_FILE."
fi
