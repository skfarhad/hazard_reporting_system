from rest_framework.serializers import ModelSerializer
from rest_framework_simplejwt.serializers import RefreshToken, TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.exceptions import NotAcceptable, PermissionDenied, \
    AuthenticationFailed, ValidationError

from apps.user.fb_auth import get_validated_phone
from apps.user.models import User
# from django.core.validators import RegexValidator
# alphanumeric = RegexValidator(r'^[0-9a-zA-Z]*$', 'Only alphanumeric characters are allowed.')



def validate_username(username):
    if len(username) < 5 or not username.isalnum():
        msg = 'Username should be alphanumeric and contain at least 5 characters!'
        raise NotAcceptable(detail=msg)


def validate_password(password):
    if len(password) < 8:
        msg = 'Provide at least 8 characters!'
        raise ValidationError(detail=msg)


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=32, required=True)
    access_token = serializers.CharField(max_length=255, required=True)
    full_name = serializers.CharField(max_length=255, required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(max_length=255, required=True)

    def signup_user(self, validated_data):
        username = validated_data['username']
        access_token = validated_data['access_token']
        phone = get_validated_phone(access_token)
        full_name = validated_data.get('full_name', '')
        email = validated_data.get('email', '')
        password = validated_data['password']
        if not phone:
            raise ValidationError(detail='Invalid token!')

        if User.objects.filter(username__exact=username).exists():
            raise ValidationError(detail='Username exists!')

        validate_username(username)
        validate_password(password)

        user = User.objects.create(
            username=username,
            phone=phone,
            full_name=full_name,
            email=email
        )
        user.set_password(password)
        user.save()
        refresh = RefreshToken.for_user(user)
        return user, str(refresh.access_token)


class PasswordLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=32, required=True)
    password = serializers.CharField(max_length=255, required=True)

    def authenticate(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']

        user_qs = User.objects.filter(username__exact=username)

        if len(user_qs) < 1:
            raise AuthenticationFailed(detail='Invalid credentials!')

        user = user_qs[0]
        if not user.check_password(password):
            raise AuthenticationFailed(detail='Invalid credentials!')

        refresh = RefreshToken.for_user(user)
        jwt_token = str(refresh.access_token)
        return user, jwt_token


class PasswordChangeOTPSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=32, required=True)
    access_token = serializers.CharField(max_length=255, required=True)
    new_password = serializers.CharField(max_length=64, required=True)

    def authenticate(self, validated_data):
        username = validated_data['username']
        access_token = validated_data['access_token']
        phone = get_validated_phone(access_token)
        new_password = validated_data['new_password']
        user_qs = User.objects.filter(username__exact=username)

        if len(user_qs) < 1:
            raise AuthenticationFailed(detail='Invalid credentials!')

        user = user_qs[0]

        if user.phone != phone:
            raise PermissionDenied(detail='Invalid Phone!')

        validate_password(new_password)
        user.set_password(new_password)
        user.save()
        return user


class ProfileSerializer(ModelSerializer):

    class Meta:
        model = User
        fields = [
            'username',
            'full_name',
            'phone',
            'email',
            'image',
        ]

        extra_kwargs = {
            'username': {'validators': []},
        }

    def create_obj(self, validated_data):
        username = validated_data.get('username', None)
        username_qs = User.objects.filter(username=username)
        if username_qs.exists():
            raise NotAcceptable(detail='username exists!')
        validate_username(username)
        try:
            user = self.create(validated_data)
        except Exception as e:
            print(str(e))
            raise NotAcceptable(detail='Something went wrong!')
        return user

    def update_obj(self, user, validated_data):
        username = validated_data.get('username', None)
        validate_username(username)
        username_qs = User.objects.filter(username=username)
        if user.username == username:
            validated_data.pop('username')
        else:
            if username_qs.exists():
                raise NotAcceptable(detail='username exists!')
        try:
            user = self.update(user, validated_data)
        except Exception as e:
            print(str(e))
            raise NotAcceptable(detail='Something went wrong!')
        return user
