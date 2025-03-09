export interface GoogleCredentials {
  accessToken: string;
}

export class GoogleService {
  private accessToken: string;

  constructor(credentials: GoogleCredentials) {
    this.accessToken = credentials.accessToken;
  }

  async getCalendarEvents(calendarId: string, timeMin: Date, timeMax: Date) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
        new URLSearchParams({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  async createCalendarEvent(calendarId: string, event: {
    summary: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
  }) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async getSheetData(spreadsheetId: string, range: string) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async updateSheetData(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update sheet data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating sheet data:', error);
      throw error;
    }
  }
} 