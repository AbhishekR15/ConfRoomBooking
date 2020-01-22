/* eslint-disable no-undef */
import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import {fireEvent} from 'c/pubsub';

export default class CreateBookingRec extends LightningElement {
    @track cardTitle='New Booking Detail';
    @wire(CurrentPageReference) pageRef;
    @track open = true;

    @api 
    openmodal() {
        this.open = true
    }

    handleSubmit(event){
        //event.preventDefault();       // stop the form from submitting
        const fields = event.detail.fields;
        fields.Status__c = 'Booked';
        this.template.querySelector('lightning-record-edit-form').submit(fields);
     }

    handleSuccess (){
        const evt = new ShowToastEvent({
            title: "Success!",
            message: "The Booking Detail's record has been successfully saved.",
            variant: "success",
        });
        this.dispatchEvent(evt);
        this.conferenceRoomBooking(evt);
    }

    conferenceRoomBooking(event) {
        // fire contactSelected event
        fireEvent(this.pageRef, 'conferenceroombooked',event.target.Id );
    }

}