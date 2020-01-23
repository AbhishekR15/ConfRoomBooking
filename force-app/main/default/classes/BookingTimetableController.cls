public with sharing class BookingTimetableController {
    
    //get room booking details for all rooms of a particular location
	//params:
	//locations: location selected
	//year,month and day of month: will be converted to appropriate Date class instance than sending date from javascript
    @AuraEnabled
    public static List<Conference_Room__c> getBookingsByDateAndTime(Date selectedDate,string selectedLocation){
        //Code will to generic helper method to get/set booking details
        string query = 'Select Id,Name,(Select Name,Start_Time__c,End_Time__c FROM Booking_Details__r where Booking_Date__c = :selectedDate) FROM Conference_Room__c';
        if(!selectedLocation.equalsIgnoreCase('All')) {
            query += ' WHERE Location__c =: selectedLocation';
        }
        List<Conference_Room__c> conferenceRoomsAndBookings = Database.query(query);
        return conferenceRoomsAndBookings;
    }

    //get all locations from picklist field on conference room object
    @AuraEnabled
    public static List<String> getAllLocations(){
        List<String> pickListValuesList= new List<String>();
		Schema.DescribeFieldResult fieldResult = Conference_Room__c.Location__c.getDescribe();
		List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
		for( Schema.PicklistEntry pickListVal : ple){
			pickListValuesList.add(pickListVal.getLabel());
		}     
		return pickListValuesList;
    }

    @AuraEnabled
    public static void createParticipantsFromBooking(string bookingId,List<string> userIds){
        if(String.isNotBlank(bookingId)) {
            List<Participant__c> participantsToInsert = new List<Participant__c>();
            Participant__c organiser = new Participant__c(Booking_Detail__c = bookingId,Guest__c = UserInfo.getUserId(),Role__c='Organizer');
            participantsToInsert.add(organiser);
            for(string userId : userIds) {
                Participant__c attendee = new Participant__c(Booking_Detail__c = bookingId,Guest__c = userId,Role__c='Attendee');
                participantsToInsert.add(attendee);
            }

            insert participantsToInsert;
        }
    }
}