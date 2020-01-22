/* eslint-disable no-undef */
/* eslint-disable no-console */
import { LightningElement,track,wire } from 'lwc';
import {loadStyle} from 'lightning/platformResourceLoader';
import TimeTableJS from '@salesforce/resourceUrl/timetablejs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {Timetable,Renderer} from './timetablees';
import getBookingsByDateAndTime from '@salesforce/apex/BookingTimetableController.getBookingsByDateAndTime';
import getAllLocations from '@salesforce/apex/BookingTimetableController.getAllLocations';
import {registerListener,unregisterAllListeners} from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';

export default class Bookingsview extends LightningElement {
    @track selectedDate;
    @track locations;
    @track selectedLocation;
    @track isLoaded = false;

    @wire(CurrentPageReference) pageRef;

    connectedCallback() {
        //Listen for event that a conference room is booked to update the timetable
        registerListener('conferenceroombooked', this.handleRoomBooked, this);

        //load CSS from resources and initialize picklist,date and get data for today and all locations
        Promise.all([
            this.loadTimetableJS(),
            this.initializeTodaysDateInSelectedDate(),
            this.initializeLocationsPicklist(),
            this.getBookingsByDateAndTimeFromApex(),
        ]).then(() =>{
            this.isLoaded = true;
        }).catch(error => {
            this.isLoaded = true;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error initializing component',
                message : error.message,
                variant:'error'
            }))
        }); 
        
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    initializeTodaysDateInSelectedDate() {
        let today = new Date();
        let month = today.getMonth()+1;
        //we have to prefix a '0' so that default value can be shown on the calendar.
        //otherwise date evaluates to 2020-1-20 and is not shown on the calendar
        if(month.toString().length === 1) {
            month = '0'+month;
        }
        this.selectedDate = today.getFullYear()+'-'+month+'-'+today.getDate();
    }

    initTimeTable(locations,events) {       
        let timetable = new Timetable();
        timetable.setScope(9, 21);
        timetable.addLocations(locations);
        let startTime,endTime;
        events.forEach(event => {
            startTime = this.formatDateInRequiredFormat(event.StartTime);
            endTime = this.formatDateInRequiredFormat(event.EndTime);
            timetable.addEvent(event.Name,event.Room,startTime,endTime);
        });
        let renderer = new Renderer(timetable);
        renderer.draw(this.template.querySelector(".timetable")); 
    }

    formatDateInRequiredFormat(dateToFormat) { 
        let dateToSplit = new Date(dateToFormat); //Converts date from ISO-UTC 2015-03-25T12:00:00Z to Wed Mar 25 2015 05:30:00 GMT+0530 (India Standard Time)
        return new Date(dateToSplit.getFullYear(),dateToSplit.getMonth()+1,dateToSplit.getDate(),dateToSplit.getHours() ,dateToSplit.getMinutes());
    }

    loadTimetableJS() {
        Promise.all([
            loadStyle(this,TimeTableJS+'/timetable.js-master/dist/styles/timetablejs.css'),
        ]).then(() => {
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading timetable',
                    message: error.message,
                    variant: 'error',
                }),
            );
        });
    }

    dateChanged(event) {
        this.isLoaded = false;
        this.selectedDate = event.target.value;
        let _self = this;
        let apexReturnPromise = new Promise(function(resolve){
            _self.getBookingsByDateAndTimeFromApex();
            resolve();
        });
        apexReturnPromise.then(()=>{this.isLoaded = true;})
        .catch((error)=>{
            this.isLoaded = true;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error fetching booking details',
                    message: error.message,
                    variant: 'error',
                }),
            );
        });
    }

    handleLocationChange(event) {
        this.isLoaded = false;
        this.selectedLocation = event.target.value;
        let _self = this;
        let apexReturnPromise = new Promise(function(resolve){
            _self.getBookingsByDateAndTimeFromApex();
            resolve();
        });
        apexReturnPromise.then(()=>{this.isLoaded = true;})
        .catch((error)=>{
            this.isLoaded = true;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error fetching booking details',
                    message: error.message,
                    variant: 'error',
                }),
            );
        });
    }

    getBookingsByDateAndTimeFromApex() {
        if(this.selectedDate != null && this.selectedLocation != null && this.selectedLocation !=='') {
            getBookingsByDateAndTime({selectedDate : this.selectedDate,selectedLocation : this.selectedLocation})
            .then((result) => {
                this.prepareDataForTimeTableInput(result);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error fetching booking details',
                        message: error.message,
                        variant: 'error',
                    }),
                );
            });
        } else {
            this.dispatchEvent(new ShowToastEvent({
                title : 'Required Fields',
                error : 'Please select a date and location',
                variant : 'error'
            }));
        }
    }

    initializeLocationsPicklist() {
        this.locations = [];
        this.locations.push({label : 'All', value : 'All'});
        //'All' is selected by default
        this.selectedLocation = this.locations[0].value;
        getAllLocations()
        .then((result) => {
            let tempLocationArray = [];
            result.forEach(location => {
                tempLocationArray.push({label : location,value : location});
            });
            this.locations = this.locations.concat(tempLocationArray);
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                title : 'Error getting locations',
                message : error.message,
                variant : 'error',
            }),
            )
        });
    }

    prepareDataForTimeTableInput(roomsAndBookings) {
        let locations = [];
        let bookings = [];
        roomsAndBookings.forEach(roomAndBooking => {
            locations.push(roomAndBooking.Name);
            if(roomAndBooking.Booking_Details__r != null && roomAndBooking.Booking_Details__r !== undefined) {
                roomAndBooking.Booking_Details__r.forEach(booking => {
                    bookings.push({Name : booking.Name,Room : roomAndBooking.Name,StartTime : booking.Start_Time__c,EndTime : booking.End_Time__c});
                });
            }
        });
        this.initTimeTable(locations,bookings);
    }

    handleRoomBooked() {
        this.connectedCallback();
    }
}