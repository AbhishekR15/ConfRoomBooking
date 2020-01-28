/* eslint-disable no-undef */
import { LightningElement, track, wire, api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import validateBookingRec from '@salesforce/apex/ValidateBookingRecord.validateBookingRec';
import createParticipantsFromBooking from '@salesforce/apex/BookingTimetableController.createParticipantsFromBooking';
import {fireEvent} from 'c/pubsub';
import sendCommunicationToParticipants from '@salesforce/apex/BookingDetailHelper.sendCommunicationToParticipants';

    const HAS_ERROR = false;
export default class CreateBookingRec extends LightningElement {
    @track cardTitle='New Booking Detail';
    @track confRoom;
    @track duration;
    @track startTime;
    @track hasErrors = HAS_ERROR;
   // @api bookingRec = this.bookingRec;
    @wire(CurrentPageReference) pageRef;
    @wire(validateBookingRec,{bookingRec: 'bookingRec'}) booking;

    
    handleSubmit(event){
        console.log('onsubmit');
        event.preventDefault();       // stop the form from submitting
        const fields = event.detail.fields;
        //let hasErrors;
        this.validateAndSaveBookingRec(event);
        
        
     }



    handleSuccess(event){
        const evt = new ShowToastEvent({
            title: "Success!",
            message: "The Booking Detail's record has been successfully saved.",
            variant: "success",
        });
        this.createParticipantRecords(event.detail.id);
        if(!this.hasErrors){
            this.dispatchEvent(evt);
            this.conferenceRoomBooking(evt);
        }
    }

    validateAndSaveBookingRec(event){
        let resultValue;
        console.log('Inside validation');
        const fields = event.detail.fields;
       this.confRoom = fields.Conference_Room__c;
       this.duration = fields.Duration__c;
       this.startTime = fields.Start_Time__c;
       console.log("confRoom", this.confRoom);
       console.log("duration", this.duration);
       console.log("startTime", this.startTime);

       validateBookingRec({
         confRoom: this.confRoom,
         startTime: this.startTime,
         duration: this.duration
       })
         .then(result => {
            console.log('result: ', result);
            if(result === true) {
                let evt = new ShowToastEvent({
                    title: "Error creating participant records",
                    message: 'Conference Room is already booked for selected Datetime',
                    variant: "error",
                });
                this.dispatchEvent(evt);
            } else {
                fields.Status__c = 'Booked';
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            }
            //return result;
        })
         .catch(error => {
           //this.hasErrors = true;
           console.log('error in displaying:', error.body.message);
            let evt = new ShowToastEvent({
               title: "Error is validateBookingRec",
               message: error.body.message,
               variant: "error"
             });
             this.dispatchEvent(evt);
             //return true;
         }); 
        
    }

    conferenceRoomBooking(event) {
        // fire contactSelected event
        fireEvent(this.pageRef, 'conferenceroombooked',event.target.Id );
    }

    createParticipantRecords(newBookingId) {
        let selectedUsers = this.template.querySelector('c-multi-select-lookup');
        let selectedUserIds = [];
        if(selectedUsers != null && selectedUsers !== undefined) {
            this.template.querySelector('c-multi-select-lookup').selectedRecords.forEach(record => {
                selectedUserIds.push(record.recId);
            });
            
        }
        createParticipantsFromBooking({bookingId : newBookingId,userIds : selectedUserIds})
        .then(() => {
            sendCommunicationToParticipants({bookingId : newBookingId,emailType: 'new'})
            .then()
            .catch((error)=> {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title : 'Error sending booking canceled Email',
                        error : error.message,
                        variant : 'error'
                    })
                )
            });
        })
        .catch((error) => {
            let evt = new ShowToastEvent({
                title: "Error creating participant records",
                message: error.message,
                variant: "success",
            });
            this.dispatchEvent(evt);
        }
        ); 
    }

}