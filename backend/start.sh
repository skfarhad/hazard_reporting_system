#!/bin/bash

poetry run python manage.py collectstatic --noinput;
poetry run gunicorn -c config/gunicorn.conf.py config.wsgi:application