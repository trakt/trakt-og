/** The calendar `/calendars` opens: My Shows & Movies signed in, All Premieres signed out (OG opened All Shows). */
export const calendarHome = (signedIn: boolean) => (signedIn ? '/calendars/my/shows-movies' : '/calendars/premieres');
