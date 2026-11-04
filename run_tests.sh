#!/bin/bash

python manage.py migrate
# Only the Django apps; smsparser/ holds standalone scripts with their own tests.
python manage.py test apps
