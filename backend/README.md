Sure! Here’s the complete `README.md` file content in one block:

```markdown
# Hazard Reporting System

## Prerequisites
- Docker and Docker Compose installed on your machine


### Running with Docker

1. **Build and Start Containers**
   ```bash
   docker-compose up --build
   ```

2. **Create Database Tables**
   In a separate terminal, run:
   ```bash
   docker-compose exec be python manage.py migrate
   ```

3. **Create a Superuser**
   Create an admin user to access the Django admin interface:
   ```bash
   docker-compose exec be python manage.py createsuperuser
   ```

4. **Access the Application**
   The application will be available at [http://localhost:8000](http://localhost:8000).

5. **Access the Django Admin Interface**
   The Django admin interface will be available at [http://localhost:8000/admin](http://localhost:8000/admin).

### Testing

1. **Run Tests**
   To run tests, use:
   ```bash
   docker-compose exec be python manage.py test
   ```


## Troubleshooting
- Ensure that Docker and Docker Compose are correctly installed.
- Check the `.env` file for any missing or incorrect values.
- Review the logs for Docker services to diagnose any issues.

