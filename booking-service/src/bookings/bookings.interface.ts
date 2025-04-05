export interface ReadBooking {
    bookingId?: string;
    datetime: Date;
    duration: number;
    description?: string;
  }
  
  export interface freeSlot {
    start: Date;
    end: Date;
  }
  