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
    if (len(username) < 5) or (not username.isalnum()):
        msg = f'Username should be alphanumeric and contain at least 5 characters!'
        raise ValidationError(detail=msg)


def validate_password(password):
    if len(password) < 8:
        msg = 'Provide at least 8 characters!'
        raise ValidationError(detail=msg)


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=32, required=True)
    password = serializers.CharField(max_length=255, required=True)
    fb_phone_token = serializers.CharField(max_length=255, required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def signup_user(self, validated_data):
        username = validated_data['username']
        fb_phone_token = validated_data.get('fb_phone_token', "")
        phone = get_validated_phone(fb_phone_token)
        full_name = validated_data.get('full_name', '')
        email = validated_data.get('email', '')
        password = validated_data['password']
        if not phone:
            phone = ""
            # creating accounts without phone validation
            # raise ValidationError(detail='Invalid token!')
        if User.objects.filter(username__exact=username).exists():
            raise NotAcceptable(detail='Username exists!')

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
    fb_phone_token = serializers.CharField(max_length=255, required=True)
    new_password = serializers.CharField(max_length=64, required=True)

    def authenticate(self, validated_data):
        username = validated_data['username']
        fb_phone_token = validated_data['fb_phone_token']
        phone = get_validated_phone(fb_phone_token)
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
            # print(str(e))
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
            # print(str(e))
            raise NotAcceptable(detail='Something went wrong!')
        return user


class SignupRespSerializer(serializers.Serializer):
    user_details = ProfileSerializer()
    jwt_token = serializers.CharField(max_length=255, required=True)


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=255, required=True)
    new_password = serializers.CharField(max_length=255, required=True)

    def authenticate(self, user, validated_date):
        min_len = 8
        old_password = validated_date.get('old_password', False)
        new_password = validated_date.get('new_password', False)
        if not (old_password or new_password):
            raise ValidationError(detail='Provide old and new password!')

        if len(new_password) < min_len:
            raise ValidationError(detail=f'Password is too short! Should have more than {str(min_len)} characters!')

        if not user.check_password(old_password):
            raise ValidationError(detail='Old password is wrong!')

        if old_password == new_password:
            raise NotAcceptable(detail='New password should be different!')

        user.set_password(new_password)
        user.save()
        return user


class MessageSerializer(serializers.Serializer):
    details = serializers.CharField(max_length=255, required=True)
