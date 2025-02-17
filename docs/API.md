### API Documentation

1. **`GET /hosts`**  
    **Request:**

   - No request body or headers needed.  
     **Response:**

   ```json
   [
     {
       "name": "Server",
       "mac": "e8:e0:5e:97:3d:af",
       "ip": "192.168.2.7",
       "periodicPing": 60
     },
     {
       "name": "PC",
       "mac": "ff:e9:9e:97:3d:af",
       "ip": "192.168.2.9",
       "periodicPing": 0
     }
   ]
   ```

   **Description:**  
    Retrieves the list of computers.

2. **`POST /hosts`**  
   **Request Headers:**

   - `Content-Type: application/json`  
     **Request Body:**

   ```json
   {
     "name": "string",
     "mac": "string",
     "ip": "string",
     "periodicPing": long int // seconds
   }
   ```

   **Response:**

   ```json
   {
     "success": boolean,
     "message": "string"
   }
   ```

   **Description:**  
   Adds a new computer to the list.

3. **`GET /hosts?id={index}`**  
   **Request:**

   - Pass the computer index via query parameter.  
     **Response:**

   ```json
   {
     "name": "string",
     "mac": "string",
     "ip": "string",
     "periodicPing": long int, // seconds
     "lastPing": long int // seconds
   }
   ```

   **Description:**  
   Retrieves detailed information of a specific computer by its index.

4. **`PUT /hosts?id={index}`**  
   **Request Headers:**

   - `Content-Type: application/json`  
     **Request Body:**

   ```json
   {
     "name": "string",
     "mac": "string",
     "ip": "string",
     "periodicPing": long int
   }
   ```

   **Response:**

   ```json
   {
     "success": boolean,
     "message": "string"
   }
   ```

   **Description:**  
   Updates the information of a specific computer identified by its index.

5. **`DELETE /hosts?id={index}`**  
   **Request:**

   - Pass the computer index via query parameter.  
     **Response:**

   ```json
   {
     "success": boolean,
     "message": "string"
   }
   ```

   **Description:**  
   Deletes a specific computer by its index.

6. **`POST /ping?id={index}`**  
   **Request:**

   - Pass the computer index via query parameter.  
     **Response:**

   ```json
   {
     "success": boolean,
     "message": "string"
   }
   ```

   **Description:**  
   Sends a ping request to the specified host by index.

7. **`POST /wake?id={index}`**  
   **Request:**

   - Pass the computer index via query parameter.  
     **Response:**

   ```json
   {
     "success": boolean,
     "message": "string"
   }
   ```

   **Description:**  
   Sends a Wake-on-LAN (WOL) packet to the specified host by index.

8. **`GET /about`**  
   **Request:**

   - No request body or headers needed.  
     **Response:**

   ```json
   {
     "version": "string",
     "lastVersion": boolean,
     "hostname": "string"
   }
   ```

   **Description:**  
   Retrieves information about the system's version and hostname.

9. **`GET /networkSettings`**  
   **Request:**

   - No request body or headers needed.  
     **Response:**

   ```json
   {
     "enable": boolean,
     "ip": "string",
     "networkMask": "string",
     "gateway": "string"
   }
   ```

   **Description:**  
   Retrieves current network settings.

10. **`PUT /networkSettings`**  
    **Request Headers:**

    - `Content-Type: application/json`  
      **Request Body:**

    ```json
    {
      "enable": boolean,
      "ip": "string",
      "networkMask": "string",
      "gateway": "string"
    }
    ```

    **Response:**

    ```json
    {
      "success": boolean,
      "message": "string"
    }
    ```

    **Description:**  
    Updates network settings.

11. **`GET /authenticationSettings`**  
    **Request:**

    - No request body or headers needed.  
      **Response:**

    ```json
    {
      "enable": boolean,
      "username": "string",
      "password": "string"
    }
    ```

    **Description:**  
    Retrieves authentication settings.

12. **`PUT /authenticationSettings`**  
    **Request Headers:**

    - `Content-Type: application/json`  
      **Request Body:**

    ```json
    {
      "enable": boolean,
      "username": "string",
      "password": "string"
    }
    ```

    **Response:**

    ```json
    {
      "success": boolean,
      "message": "string"
    }
    ```

    **Description:**  
    Updates authentication settings.

13. **`POST /resetWifi`**  
    **Request:**

    - No request body or headers needed.  
      **Response:**

    ```json
    {
      "success": boolean,
      "message": "string"
    }
    ```

    **Description:**  
    Resets Wi-Fi settings to default values.

14. **`GET /updateVersion`**  
    **Request:**

    - No request body or headers needed.  
      **Response:**

    ```json
    {
      "version": "string",
      "lastVersion": "string"
    }
    ```

    **Description:**  
    Get information about last version.

15. **`POST /updateVersion`**  
    **Request:**

    - No request body or headers needed.  
      **Response:**

    ```json
    {
      "success": boolean,
      "message": "string"
    }
    ```

    **Description:**  
    Update to last version.

16. **`POST /import`**
    
    **Request:**

    ```json
    [
      {
        "name": "Server",
        "mac": "e8:e0:5e:97:3d:af",
        "ip": "192.168.2.7",
        "periodicPing": 60
      },
      {
        "name": "PC",
        "mac": "ff:e9:9e:97:3d:af",
        "ip": "192.168.2.9"
      }
    ]
    ```

    **Response:**

    ```json
    {
      "success": boolean,
      "message": "string"
    }
    ```

    **Description:**  
    Import host database.
