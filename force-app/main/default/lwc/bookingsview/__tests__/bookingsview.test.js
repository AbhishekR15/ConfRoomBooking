/* eslint-disable no-unused-vars */
import {createElement} from 'lwc';
import BookingView from 'c/bookingsview';
import getBookingsByDateAndTime from '@salesforce/apex/BookingTimetableController.getBookingsByDateAndTime';
import getAllLocations from '@salesforce/apex/BookingTimetableController.getAllLocations';

jest.mock(
    '@salesforce/apex/BookingTimetableController.getAllLocations',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

jest.mock(
    '@salesforce/apex/BookingTimetableController.getBookingsByDateAndTime',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

jest.mock('c/pubsub', () => {
    return {
        registerListener: jest.fn(),
        unregisterAllListeners: jest.fn()
    }
});


const LOCATIONS_LIST = ['TestLocation1','TestLocation2'];
const ROOM_BOOKING_LIST = [{
	"Id": "a086F00002cCLHLQA4",
	"Name": "TestLocation1",
	"Booking_Details__r": [{
		"Conference_Room__c": "a086F00002cCLHLQA4",
		"Id": "a096F00002XsZWrQAN",
		"Name": "Bluepineapple 1.0",
		"Start_Time__c": "2020-01-31T02:30:00.000Z",
		"End_Time__c": "2020-01-31T03:00:00.000Z",
		"CreatedById": "0056F00000CxYjLQAV"
	}, {
		"Conference_Room__c": "a086F00002cCLHLQA4",
		"Id": "a096F00002XsZYUQA3",
		"Name": "Bluepineapple 1.2",
		"Start_Time__c": "2020-01-31T04:00:00.000Z",
		"End_Time__c": "2020-01-31T04:30:00.000Z",
		"CreatedById": "0056F00000CxYjLQAV"
	}]
}, {
	"Id": "a086F00002cCL97QAG",
	"Name": "TestLocation2",
	"Booking_Details__r": [{
		"Conference_Room__c": "a086F00002cCL97QAG",
		"Id": "a096F00002XsZd2QAF",
		"Name": "Bluepineapple 1.3",
		"Start_Time__c": "2020-01-31T02:30:00.000Z",
		"End_Time__c": "2020-01-31T03:30:00.000Z",
		"CreatedById": "0056F00000CxYjLQAV"
	}]

}];

const NO_ROOM_BOOKING_LIST = [{
	"Id": "a086F00002cCLHLQA4",
	"Name": "TestLocation1",
	"Booking_Details__r": []
}, {
	"Id": "a086F00002cCL97QAG",
	"Name": "TestLocation2",
	"Booking_Details__r": []
}];

describe('c-createbookingsview',() => {
    afterEach(() =>{
        while(document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('Renders with default date and all rooms',()=> {
        getAllLocations.mockResolvedValue(LOCATIONS_LIST);
        getBookingsByDateAndTime.mockResolvedValue(ROOM_BOOKING_LIST);
        const element = createElement('c-bookingsview',{
            is : BookingView
        });
        document.body.appendChild(element);
        return Promise.resolve().then(() => {
            let locationElements = element.shadowRoot.querySelectorAll('div.timetable > aside > ul > li');
            expect(locationElements.length).toEqual(2);
            let eventElements = element.shadowRoot.querySelectorAll('span.time-entry');
            expect(eventElements.length).toEqual(3);
        });
    } );

    it('Renders with tomorrow date and all rooms',()=> {
        getAllLocations.mockResolvedValue(LOCATIONS_LIST);
        getBookingsByDateAndTime.mockResolvedValue(NO_ROOM_BOOKING_LIST);
        const element = createElement('c-bookingsview',{
            is : BookingView
        });
        element.selectedDate = "2020-02-01";
        element.dispatchEvent(new CustomEvent('change',{target:{value : "2020-02-01"}}));
        document.body.appendChild(element);
        
        return Promise.resolve().then(() => {
            let locationElements = element.shadowRoot.querySelectorAll('div.timetable > aside > ul > li');
            expect(locationElements.length).toEqual(2);
            let eventElements = element.shadowRoot.querySelectorAll('span.time-entry');
            expect(eventElements.length).toEqual(0);
        });
    } );
});