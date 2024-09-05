from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import UserManager, PermissionsMixin
from django.db import models

from apps.common.models import TSFieldsIndexed


class SimpleUserManager(UserManager):

    def create_superuser(self, username, password, **extra_fields):
        # email = self.normalize_email(email)
        user = self.model(username=username, **extra_fields)
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save(using=self._db)
        print("CREATED SUPERUSER!", extra_fields)
        return user


class User(AbstractBaseUser, PermissionsMixin, TSFieldsIndexed):
    username = models.CharField(max_length=64, unique=True, null=False)
    full_name = models.CharField(max_length=128, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=16, null=True, blank=True)

    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    image = models.URLField(null=True, blank=True)
    fb_token = models.TextField(null=True, blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = SimpleUserManager()

    def get_full_name(self):
        return self.full_name if self.full_name else 'None'

    def get_short_name(self):
        return self.full_name.split(' ')[0] if self.full_name else 'None'

    def __str__(self):
        return self.username

