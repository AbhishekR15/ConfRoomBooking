import { LightningElement, api, wire, track } from 'lwc';
import getParticipants from '@salesforce/apex/BookingController.getParticipants';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord} from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';


export default class BookingController extends LightningElement {

    @wire(getParticipants) participants; 
	@track openModal;
	
	cancelSelectedBookings(event) {
		
		let records = [];
        let allInputElements = this.template.querySelectorAll('lightning-input');

		allInputElements.forEach(function(element){
			if(element.type === 'checkbox' && element.checked && element.value){
				let record = {
					fields: {
						Id:  element.value,
						Status__c : 'Cancelled',
					},
				};
				records.push(record);
			}
		});
		
		if(records && records.length === 0){
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Warning',
					message: 'No booking records found for cancelletion. Please select.',
					variant: 'warning',
				}),
			);
		}else{
			const recordInputs = records;
			const promises = recordInputs.map(recordInput => updateRecord(recordInput));
			Promise.all(promises)
				.then(() => {
					this.dispatchEvent(
						new ShowToastEvent({
							title: 'Success',
							message: 'Booking has been cancelled',
							variant: 'success',
						}),
					);
					refreshApex(this.participants)
				})
				.catch(error => {
					this.dispatchEvent(
						new ShowToastEvent({
							title: 'Error on data save',
							message: error.message.body,
							variant: 'error',
						}),
					);
				});
		}		
		
    }
	
	cancelBooking(event) {
		let record = {
			fields: {
				Id: event.target.dataset.item,
				Status__c : 'Cancelled',
			},
	    };
		updateRecord(record)
			.then(() => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Success',
						message: 'Booking has been cancelled',
						variant: 'success',
					}),
				);
				refreshApex(this.participants)
			})
			.catch(error => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Error on data save',
						message: error.message.body,
						variant: 'error',
					}),
				);
			});
	}

	enableCancelButton(event){
		let allInputElements = this.template.querySelectorAll('lightning-button');

		allInputElements.forEach(function(element){
			if(element.dataset.item && event.target.value && element.dataset.item === event.target.value){
				if(element.disabled){
					element.disabled = false;
				}else{
					element.disabled = true;
				}
				
			}
			
		});
	}

	handleNewBookingClick(event){
		this.openModal = true;
	}
}