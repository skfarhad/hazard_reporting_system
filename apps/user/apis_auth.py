from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from apps.user.serializers import (
    PasswordLoginSerializer, SignupSerializer,
    PasswordChangeOTPSerializer, SignupRespSerializer,
    MessageSerializer, PasswordChangeSerializer
)
from apps.user.serializers import ProfileSerializer


def get_profile_details(user):
    return ProfileSerializer(user).data


class Signup(APIView):
    permission_classes = (AllowAny,)

    @swagger_auto_schema(
        operation_description="Signup for a User",
        request_body=SignupSerializer,
        responses={
            200: openapi.Response(
                description="", schema=SignupRespSerializer
            ),
            400: "Bad Request - Invalid data",
        },
    )
    def post(self, request, format=None):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user, jwt_token = serializer.signup_user(serializer.validated_data)
            data = {
                'user_details': get_profile_details(user),
                'jwt_token': jwt_token,
            }
            return Response(data, status=200)
        return Response({'detail': str(serializer.errors)}, status=400)


class PasswordLogin(APIView):
    permission_classes = (AllowAny,)

    @swagger_auto_schema(
        operation_description="Login for a User",
        request_body=PasswordLoginSerializer,
        responses={
            200: openapi.Response(
                description="", schema=SignupRespSerializer
            ),
            400: "Bad Request - Invalid data",
        },
    )
    def post(self, request, format=None):
        serializer = PasswordLoginSerializer(data=request.data)
        if serializer.is_valid():
            user, jwt_token = serializer.authenticate(serializer.validated_data)
            data = {
                'user_details': get_profile_details(user),
                'jwt_token': jwt_token,
            }
            return Response(data, status=200)
        return Response({'detail': str(serializer.errors)}, status=400)


class PasswordChange(APIView):
    permission_classes = (IsAuthenticated,)

    @swagger_auto_schema(
        operation_description="Login for a User",
        request_body=PasswordChangeSerializer,
        responses={
            200: openapi.Response(
                description="", schema=MessageSerializer
            ),
            400: "Bad Request - Invalid data",
        },
    )
    def post(self, request, format=None):
        # print("Request", serializer.data)
        serializer = PasswordChangeSerializer(
            data=request.data
        )
        if serializer.is_valid():
            user = serializer.authenticate(request.user, serializer.validated_data)
            data = {
                'detail': 'OK',
            }
            return Response(data, status=200)
        return Response({'detail': str(serializer.errors)}, status=400)


class PasswordChangeOtp(APIView):
    permission_classes = (AllowAny,)

    @swagger_auto_schema(
        operation_description="Login for a User",
        request_body=PasswordChangeOTPSerializer,
        responses={
            200: openapi.Response(
                description="", schema=MessageSerializer
            ),
            400: "Bad Request - Invalid data",
        },
    )
    def post(self, request, format=None):
        serializer = PasswordChangeOTPSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.authenticate(serializer.validated_data)
            data = {
                'detail': 'OK',
            }
            return Response(data, status=200)
        return Response({'detail': str(serializer.errors)}, status=400)


class PasswordSet(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, format=None):
        """
        Sample Submit:
        ---
            {
                'password': 'asdfasdfasdf1',
            }
        """
        user = request.user
        if user.has_usable_password():
            return Response({'msg': 'Use OTP method!'}, status=406)
        password = request.data.get('password', False)
        if not password or len(password) < 8:
            return Response({'msg': 'Provide a valid password!'}, status=400)

        user.set_password(password)
        user.save()
        return Response({'msg': 'OK'}, status=200)
