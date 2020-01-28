@isTest
public class BookingViewControllerTest {

    @TestSetup
    static void makeData(){
        Conference_Room__c confRoom = new Conference_Room__c(Name='Test Room',Location__c='Wakad Level 3');
        insert confRoom;
        Booking_Detail__c bookingDetail = new Booking_Detail__c(Start_Time__c = System.now(),Name = 'Test Booking',Duration__c = '1.0',Conference_Room__c = confRoom.Id);
        insert bookingDetail;
    }

    @isTest
    public static void testGetLocations() {
        List<String> locations = BookingTimetableController.getAllLocations();
        System.assert(locations != NULL && locations.size() > 0);
    }

    @isTest
    public static void testGetRoomBySpecificLocAndDate() {
        List<Conference_Room__c> rooms = BookingTimetableController.getBookingsByDateAndTime(System.today(),'Wakad Level 3');
        System.assert(rooms != null && rooms.size() == 1 && rooms[0].Booking_Details__r != null && rooms[0].Booking_Details__r.size() == 1);
    }

    @isTest
    public static void testGetRoomByAllLocAndOtherDate() {
        List<Conference_Room__c> rooms = BookingTimetableController.getBookingsByDateAndTime(System.today().addDays(1),'All');
        System.assert(rooms != null && rooms.size() == 1 && rooms[0].Booking_Details__r != null && rooms[0].Booking_Details__r.size() == 0);
    }
    
    @isTest
    public static void testCreateParticipants() {
        Booking_Detail__c booking = [Select Id from Booking_Detail__c LIMIT 1];
        BookingTimetableController.createParticipantsFromBooking(booking.Id,new List<String>{UserInfo.getUserId()});
        List<Participant__c> guests = [Select Id from Participant__c];
        System.assertEquals(2, guests.size());
    }
}