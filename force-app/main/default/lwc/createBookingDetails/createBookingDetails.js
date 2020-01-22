import { LightningElement, track, api} from 'lwc';

// Importing Apex Class method
import saveBooking from '@salesforce/apex/InsertBookingDetail.saveBookingDetailRecord';

/* Custom Lookup Start*/
import findRecords from '@salesforce/apex/CustomLookupController.findRecords';
/* Custom Lookup End*/

// importing to show toast notifictions
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

// importing Account fields
import NAME_FIELD from '@salesforce/schema/Booking_Detail__c.Name';
import ROOM_FIELD from '@salesforce/schema/Booking_Detail__c.Conference_Room__c';
import DURATION_FIELD from '@salesforce/schema/Booking_Detail__c.Duration__c';
import STARTTIME_FIELD from '@salesforce/schema/Booking_Detail__c.Start_Time__c';

export default class CreateBookingDetails extends LightningElement {
    @track error;

    /* Custom Lookup Start*/
    @track records;
    @track error;
    @track selectedRecord;
    @api index;
    @api relationshipfield;
    @api iconname = "standard:account";
    @api objectName = 'Account';
    @api searchfield = 'Name';

    /*constructor(){
        super();
        this.iconname = "standard:account";
        this.objectName = 'Account';
        this.searchField = 'Name';
    }*/

    handleOnchange(event){
        //event.preventDefault();
        const searchKey = event.detail.value;
        //this.records = null;
        /* eslint-disable no-console */
        //console.log(searchKey);

        /* Call the Salesforce Apex class method to find the Records */
        findRecords({
            searchKey : searchKey, 
            objectName : this.objectName, 
            searchField : this.searchfield
        })
        .then(result => {
            this.records = result;
            for(let i=0; i < this.records.length; i++){
                const rec = this.records[i];
                this.records[i].Name = rec[this.searchfield];
            }
            this.error = undefined;
            //console.log(' records ', this.records);
        })
        .catch(error => {
            this.error = error;
            this.records = undefined;
        });
    }
    handleSelect(event){
        const selectedRecordId = event.detail;
        /* eslint-disable no-console*/
        this.selectedRecord = this.records.find( record => record.Id === selectedRecordId);
        /* fire the event with the value of RecordId for the Selected RecordId */
        const selectedRecordEvent = new CustomEvent(
            "selectedrec",
            {
                //detail : selectedRecordId
                detail : { recordId : selectedRecordId, index : this.index, relationshipfield : this.relationshipfield}
            }
        );
        this.dispatchEvent(selectedRecordEvent);
    }

    handleRemove(event){
        event.preventDefault();
        this.selectedRecord = undefined;
        this.records = undefined;
        this.error = undefined;
        /* fire the event with the value of undefined for the Selected RecordId */
        const selectedRecordEvent = new CustomEvent(
            "selectedrec",
            {
                detail : { recordId : undefined, index : this.index, relationshipfield : this.relationshipfield}
            }
        );
        this.dispatchEvent(selectedRecordEvent);
    }
    /* Custom Lookup End*/

    // this object have record information
    @track bookingRecord = {
        Name : NAME_FIELD,
        Room : ROOM_FIELD,
        Duration : DURATION_FIELD,
        StartTime : STARTTIME_FIELD
    };


    handleNameChange(event) {
        this.bookingRecord.Name = event.target.value;
        window.console.log('Name ==> '+this.bookingRecord.Name);
    }

    handleDurationChange(event) {
        this.bookingRecord.Duration = event.target.value;
        window.console.log('Duration ==> '+this.bookingRecord.Duration);
    }

    handleStartTimeChange(event) {
        this.bookingRecord.StartTime = event.target.value;
        window.console.log('StartTime ==> '+this.bookingRecord.StartTime);
    }

    handleRoomChange(event) {
        this.bookingRecord.Room = event.target.value;
        window.console.log('Room ==> '+this.bookingRecord.Room);
    }


    handleSave() {
        saveBooking({obj: this.bookingRecord})
        .then(result => {
            // Clear the user enter values
            this.bookingRecord = {};

            window.console.log('result ===> '+result);
            // Show success messsage
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!!',
                message: 'Booking Detail Created Successfully!!',
                variant: 'success'
            }),);
        })
        .catch(error => {
            window.console.log('Exception Occured');
            this.error = error.message;
        });
    }
}