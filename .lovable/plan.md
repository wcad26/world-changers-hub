## Plan

1. **Separate lookup contact from submitted attendee details**
   - Treat the first email/phone used to find a person as a lookup key only.
   - Treat the emails and phones entered in the attendee details form as the final registration data that must be saved.
   - Ensure choosing “telephone” for lookup never causes submitted email fields to be ignored.

2. **Frontend registration payload fixes**
   - Review `SpecialEventRegister.tsx` and `SpecialEventOnboardForm.tsx` so every new primary attendee and every new family attendee sends:
     - family name / last name
     - other names / first name
     - email
     - phone
     - address
     - date of birth
     - gender
     - occupation and other registration fields
   - Preserve the email entered in the form even when the lookup mode is phone.
   - Preserve the phone entered in the form even when the lookup mode is email.
   - In update mode, avoid overwriting a valid stored email with blank data.

3. **Backend profile/member resolution fixes**
   - Update `event-special-register` so `resolveOrCreateMember` uses both submitted email and submitted phone gracefully.
   - If a matching profile is found by phone and the submitted email belongs to the same person or the profile email is blank, update the profile email safely.
   - If the submitted email already belongs to a different person, return a clear duplicate-email error instead of failing silently.
   - Do the same protection for phone collisions where one phone points to another profile.

4. **Event pre-registration row storage**
   - Ensure `event_pre_registrations.email` and `event_pre_registrations.phone` are populated from the final submitted attendee details, not only from the lookup method.
   - For existing members/family found by lookup, fall back to profile email/phone only when no submitted contact value is available.
   - For update registrations, refresh the previous pre-registration row with the corrected email/phone instead of leaving stale or null values.

5. **Submit-button and validation behavior**
   - Keep the submit button enabled whenever all visible required form details are valid.
   - Add clearer validation feedback for missing/invalid email or phone so users know exactly what prevents submission.
   - Ensure update mode follows the same validation rules and does not get blocked because the user originally searched by phone.

6. **Friendly duplicate handling**
   - Keep client-side duplicate detection across primary + family attendees.
   - Strengthen server-side duplicate checks so repeated emails or repeated phone numbers return localized, user-friendly messages in English and French.
   - Handle database uniqueness/auth/profile conflicts with clear messages such as “This email is already used by another registrant. Please enter the correct email.”

7. **Verify the profile/auth-account problem is not recurring**
   - Confirm the event registration path still provisions or reuses `auth.users` correctly through the shared `ensureAuthUser` helper.
   - Ensure new profiles created through special-event pre-registration can later sign in to the member portal with the default password.
   - Ensure admins can assign roles to those profiles after registration.

8. **Test scenarios**
   - New registrant found by phone, then fills email: email is saved to profile and pre-registration.
   - New registrant found by email, then fills phone: phone is saved.
   - Family member added by phone, then fills email: email is saved.
   - Update existing registration found by phone: corrected email is preserved.
   - Duplicate email across two submitted attendees: clear error shown.
   - Email belongs to another profile: clear conflict error shown.
   - Successful submission/update reaches the confirmation screen.