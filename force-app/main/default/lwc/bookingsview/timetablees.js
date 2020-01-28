/* eslint-disable no-undef */
/* eslint-disable @lwc/lwc/no-document-query */
/* eslint-disable no-unused-vars */
/* eslint-disable guard-for-in */
/* eslint-disable no-mixed-spaces-and-tabs */
import {syncscroll} from './syncscroll';

export class Timetable{
	scope = {
        hourStart: 9,
        hourEnd: 17
    };
    usingTwelveHour = false;
    locations = [];
    events = [];

    constructor() {
        this.scope = {
            hourStart: 9,
            hourEnd: 17
        };
        this.usingTwelveHour = false;
        this.locations = [];
        this.events = [];
    }

    isValidHourRange(start, end) {
		return this.isValidHour(start) && this.isValidHour(end);
    }
    
    isValidHour(number) {
		return this.isInt(number) && this.isInHourRange(number);
	}
	 isInt(number) {
		return number === parseInt(number, 10);
	}
	 isInHourRange(number) {
		return number >= 0 && number < 24;
	}
	 locationExistsIn(loc, locs) {
		return locs.indexOf(loc) !== -1;
	}
	 isValidTimeRange(start, end) {
		const correctTypes = start instanceof Date && end instanceof Date;
		const correctOrder = start < end;
		return correctTypes && correctOrder;
	}
	 getDurationHours(startHour, endHour) {
		return endHour >= startHour ? endHour - startHour : 24 + endHour - startHour;
    }
    
    setScope(start, end) {
        if (this.isValidHourRange(start, end)) {
            this.scope.hourStart = start;
            this.scope.hourEnd = end;
        } else {
            throw new RangeError('Timetable scope should consist of (start, end) in whole hours from 0 to 23');
        }

        return this;
    }
    useTwelveHour() {
        this.usingTwelveHour = true;
    }

    hasProperFormat(newLocations) {
        return newLocations instanceof Array;
    }

    addLocations(newLocations) {
        const existingLocations = this.locations;

        if (this.hasProperFormat(newLocations)) {
            newLocations.forEach(loc => {
                if (!this.locationExistsIn(loc, existingLocations)) {
                    existingLocations.push(loc);
                } else {
                    throw new Error('Location already exists');
                }
            });
        } else {
            throw new Error('Tried to add locations in wrong format');
        }

        return this;
    }
    addEvent(name, location, start, end, options) {
        if (!this.locationExistsIn(location, this.locations)) {
            throw new Error('Unknown location');
        }
        if (!this.isValidTimeRange(start, end)) {
            throw new Error(`Invalid time range: ${JSON.stringify([start, end])}`);
        }

        const optionsHasValidType = Object.prototype.toString.call(options) === '[object Object]';

        this.events.push({
            name,
            location,
            startDate: start,
            endDate: end,
            options: optionsHasValidType ? options : undefined
        });

        return this;
    }
}
export class Renderer {
    timetable;
    scopeDurationHours;
    constructor(tt) {
        if (!(tt instanceof Timetable)) {
            throw new Error('Initialize renderer using a Timetable');
        }
        this.timetable = tt;
    }

    emptyNode(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }
    
     prettyFormatHour(hour, usingTwelveHour) {
        let prettyHour;
            if(usingTwelveHour) {
                    const period = hour >= 12 ? 'PM':'AM';
                    prettyHour = `${(hour + 11) % 12 + 1}:00${period}`;
            } else {
                    const prefix = hour < 10 ? '0' : '';
                    prettyHour = `${prefix + hour}:00`;
            }
        return prettyHour;
    }

    checkContainerPrecondition(container) {
        if (container === null) {
            throw new Error('Timetable container not found');
        }
    }

    appendTimetableAside(container) {
        const asideNode = container.appendChild(document.createElement('aside'));
        const asideULNode = asideNode.appendChild(document.createElement('ul'));
        this.appendRowHeaders(asideULNode);
    }

    appendRowHeaders(ulNode) {
        for (let k=0; k<this.timetable.locations.length; k++) {
            const liNode = ulNode.appendChild(document.createElement('li'));
            const spanNode = liNode.appendChild(document.createElement('span'));
            spanNode.className = 'row-heading';
            spanNode.textContent = this.timetable.locations[k];
        }
    }

    appendTimetableSection(container) {
        const sectionNode = container.appendChild(document.createElement('section'));
                const headerNode = this.appendColumnHeaders(sectionNode);
                const timeNode = sectionNode.appendChild(document.createElement('time'));
        timeNode.className = 'syncscroll';
        timeNode.setAttribute('name', 'scrollheader');
        const width = `${headerNode.scrollWidth}px`;
        this.appendTimeRows(timeNode, width);
    }

    appendColumnHeaders(node) {
        const headerNode = node.appendChild(document.createElement('header'));
        headerNode.className = 'syncscroll';
headerNode.setAttribute('name', 'scrollheader');
        const headerULNode = headerNode.appendChild(document.createElement('ul'));

        let completed = false;
        let looped = false;

        for (let hour=this.timetable.scope.hourStart; !completed;) {
            const liNode = headerULNode.appendChild(document.createElement('li'));
            const spanNode = liNode.appendChild(document.createElement('span'));
            spanNode.className = 'time-label';
            spanNode.textContent = this.prettyFormatHour(hour, this.timetable.usingTwelveHour);

            if (hour === this.timetable.scope.hourEnd && (this.timetable.scope.hourStart !== this.timetable.scope.hourEnd || looped)) {
                completed = true;
            }
            if (++hour === 24) {
                hour = 0;
                looped = true;
            }
        }
        return headerNode;
    }

    appendTimeRows(node, width) {
        const ulNode = node.appendChild(document.createElement('ul'));
        ulNode.style.width = width;
        ulNode.className = 'room-timeline';
        for (let k=0; k<this.timetable.locations.length; k++) {
            const liNode = ulNode.appendChild(document.createElement('li'));
            this.appendLocationEvents(this.timetable.locations[k], liNode);/**/
        }
    }

    appendLocationEvents(location, node) {
        for (const event of this.timetable.events) {
            if (event.location === location) {
                this.appendEvent(event, node);
            }
        }
    }

    appendEvent(event, node) {
        const hasOptions = event.options !== undefined;
        let hasURL, hasAdditionalClass, hasDataAttributes, hasClickHandler = false;

        if (hasOptions) {
            hasURL = event.options.url !== undefined;
            hasAdditionalClass = event.options.class !== undefined;
            hasDataAttributes = event.options.data !== undefined;
            hasClickHandler = event.options.onClick !== undefined;
        }

        const elementType = hasURL ? 'a' : 'span';
        const eventNode = node.appendChild(document.createElement(elementType));
        const smallNode = eventNode.appendChild(document.createElement('small'));
        eventNode.title = event.name +' - '+ this.convertToProperFormat(event.startDate)+' - '+ this.convertToProperFormat(event.endDate);
        
        if (hasURL) {
            eventNode.href = event.options.url;
        }

        if (hasDataAttributes){
            for (const key in event.options.data) {
                eventNode.setAttribute(`data-${key}`, event.options.data[key]);
            }
        }

        if (hasClickHandler) {
          eventNode.addEventListener('click', e => {
            event.options.onClick(event, this.timetable, e);
            });
        }

        eventNode.className = hasAdditionalClass ? `time-entry ${event.options.class}` : 'time-entry';
        eventNode.style.width = this.computeEventBlockWidth(event);
        eventNode.style.left = this.computeEventBlockOffset(event);
        smallNode.textContent = event.name;
    }

    convertToProperFormat(timeToFormat) {
        let hourString = timeToFormat.getHours() < 10 ? '0'+timeToFormat.getHours() : timeToFormat.getHours();
        let minuteString = timeToFormat.getMinutes() < 10 ? '0'+timeToFormat.getMinutes() : timeToFormat.getMinutes();
        return hourString +':'+minuteString;
    }

    computeEventBlockWidth(event) {
        const start = event.startDate;
        const end = event.endDate;
        const durationHours = this.computeDurationInHours(start, end);
        return `${durationHours / this.scopeDurationHours * 100}%`;
    }

    computeDurationInHours(start, end) {
        return (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    }

    computeEventBlockOffset(event) {
        const scopeStartHours = this.timetable.scope.hourStart;
        const eventStartHours = event.startDate.getHours() + (event.startDate.getMinutes() / 60);
        const hoursBeforeEvent =  this.timetable.getDurationHours(scopeStartHours, eventStartHours);
        return `${hoursBeforeEvent / this.scopeDurationHours * 100}%`;
    }

    draw(selector) {
        const timetable = this.timetable;      
              this.scopeDurationHours = timetable.getDurationHours(timetable.scope.hourStart, timetable.scope.hourEnd);
              if(this.scopeDurationHours === 0 ) {
                this.scopeDurationHours = 24;
              }
              const container = selector;
              this.checkContainerPrecondition(container);
              this.emptyNode(container);
              this.appendTimetableAside(container);
              this.appendTimetableSection(container);
              let sycscroll= new syncscroll();
              sycscroll.reset();
              selector.scrollLeft = 0.33*selector.scrollWidth;
              let x= document.getElementsByClassName("syncscroll");
              if(x != null && x.length > 0) {
                x[0].scrollLeft = 0.33 * x[0].scrollWidth;
              }
          }
     
}