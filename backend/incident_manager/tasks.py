from celery import shared_task


@shared_task
def process_incident_and_send_sms(incident_id):
    """
    Background task to process an Incident and send SMS to stakeholders.

    When an Incident is created, we will simply save the object from the provider
    and immediately return an OK response. This approach avoids holding the connection
    open while performing potentially time-consuming calculations and operations.

    Instead of doing everything synchronously, this background task is triggered to
    handle all the necessary processing, including sending SMS notifications.

    Benefits of this approach:
    - The API will never timeout, ensuring a responsive user experience.
    - We achieve high scalability by offloading work to background tasks.
    - The worker queue can be managed according to our system's capacity.
    - We ensure that no incident is missed, as each one will be processed in the background.

    For now, this task is a placeholder and can be expanded with actual processing logic in the future.
    """
    pass  # Placeholder for future logic to process the incident and send SMS
