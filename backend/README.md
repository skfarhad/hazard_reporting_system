
# Hazard Reporting System

## Prerequisites
- Docker and Docker Compose installed on your machine
- Poetry for Python dependency management

## Setup
 
1. **Build and Start Containers**
   ```bashs
   docker-compose up --build
   ```

2. **Open the Poetry Shell**
   Start a shell inside the Docker container to run management commands:
   ```bash
   docker-compose exec be poetry shell
   ```

3. **Create Database Tables**
   Within the Poetry shell, run:
   ```bash
   python manage.py migrate
   ```

4. **Create a Superuser**
   Create an admin user to access the Django admin interface:
   ```bash
   python manage.py createsuperuser
   ```

5. **Access the Application**
   The application will be available at [http://localhost:8000](http://localhost:8000).

6. **Access the Django Admin Interface**
   The Django admin interface will be available at [http://localhost:8000/admin](http://localhost:8000/admin).

## Running Tests


1. **Run Tests**
   To run tests, open the Poetry shell as described above and then run:
   ```bash
   python manage.py test
   ```

## Backend Design

### Model Structure

- **Incident**: Represents an incident report with fields for contact number, provider, image, location, description, additional info, status, and address.
- **Provider**: Represents a provider with fields for name, description, API key, website link, and logo URL.
- **Volunteer**: Represents a volunteer with fields for full name, contact number, location, address, activity status, notes, and assistance type.

### API Structure

- **Incident API**: 
  Allows providers to create incidents. Requires API key for authentication.
      
  Allows you to retrieve information about incidents. You can either fetch details for a specific incident by its ID or retrieve a list of all incidents. Requires API key for authentication.
- **Volunteer API**: Provides a list of active volunteers. No authentication required.

## How to Use the APIs

- **Incident API**: 
  To create an incident, make a POST request to `/api/incidents/` with the required fields and include the API key in the `Authorization` header in the format `Api-Key <your_api_key>`.
  
 To retrieve incident data, you can make a GET request to the `/api/incidents/view/` endpoint. This can be used to fetch either a list of all incidents or a specific incident by its `/api/incidents/view/<id>` ID. The request must include an API key in the `Authorization` header in the format `Api-Key <your_api_key>`.
  
- **Volunteer API**: To retrieve the list of active volunteers, make a GET request to `/api/volunteers/`. No authentication is required.

## Signals and Background Tasks

- **Signals**: Used to perform actions when certain events occur, such as saving or deleting instances of models.
- **Background Tasks**: Managed using Celery for asynchronous processing of tasks. Ensure the Celery worker is running to handle background tasks.

## Troubleshooting

- Ensure that Docker and Docker Compose are correctly installed.
- Check the `.env` file for any missing or incorrect values.
- Review the logs for Docker services to diagnose any issues.
```

This version includes updated instructions for using Poetry and running Django management commands within the Docker container.

