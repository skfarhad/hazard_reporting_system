#!/bin/bash

python manage.py collectstatic --noinput;
gunicorn -c config/gunicorn.conf.py config.wsgi:application