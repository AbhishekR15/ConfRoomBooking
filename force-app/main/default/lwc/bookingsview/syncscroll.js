/* eslint-disable no-loop-func */
/* eslint-disable eqeqeq */
/* eslint-disable @lwc/lwc/no-document-query */
/**
 * @fileoverview syncscroll - scroll several areas simultaniously
 * @version 0.0.3
 * 
 * @license MIT, see http://github.com/asvd/intence
 * @copyright 2015 asvd <heliosframework@gmail.com> 
 */


export class syncscroll {
    static Width = 'Width';
         Height = 'Height';
         Top = 'Top';
         Left = 'Left';
         scroll = 'scroll';
         client = 'client';
         EventListener = 'EventListener';
         addEventListener = 'add' + this.EventListener;
         length = 'length';
        //let Math_round = Math.round;
    static names = {};

    reset() {
        var elems = document.getElementsByClassName('sync'+this.scroll);

        // clearing existing listeners
        var i, j, el, found, name;
        for (name in this.names) {
            if (this.names.hasOwnProperty(name)) {
                for (i = 0; i < this.names[name][length]; i++) {
                    this.names[name][i]['remove'+this.EventListener](
                        this.scroll, this.names[name][i].syn, 0
                    );
                }
            }
        }

        // setting-up the new listeners
        for (i = 0; i < elems.length;) {
            found = j = 0;
            el = elems[i++];
            if (!(name = el.getAttribute('name'))) {
                // name attribute is not set
                continue;
            }

            el = el[this.scroll+'er']||el;  // needed for intence

            // searching for existing entry in array of names;
            // searching for the element in that entry
            for (;j < (syncscroll.names[name] = syncscroll.names[name]||[])[length];) {
                found |= syncscroll.names[name][j++] == el;
            }

            if (!found) {
                syncscroll.names[name].push(el);
            }

            el.eX = el.eY = 0;
            this.callFunctionWithElAndName(el,name);
        }
    }

    callFunctionWithElAndName(el,name) {
        el.addEventListener(
            this.scroll,
            el.syn = function() {
                var elems = syncscroll.names[name];

                var scrollX = el.scrollLeft;
                var scrollY = el.scrollTop;

                var xRate =
                    scrollX /
                    (el.scrollWidth - el.clientWidth);
                var yRate =
                    scrollY /
                    (el.scrollHeight - el.clientHeight);

                var updateX = scrollX != el.eX;
                var updateY = scrollY != el.eY;

                var otherEl, i = 0;

                el.eX = scrollX;
                el.eY = scrollY;

                for (;i < elems.length;) {
                    otherEl = elems[i++];
                    if (otherEl != el) {
                        if (updateX &&
                        Math.round(
                                otherEl.scrollLeft -
                                (scrollX = otherEl.eX =
                                 Math.round(xRate *
                                     (otherEl.scrollWidth -
                                      otherEl.clientWidth))
                                )
                            )
                        ) {
                            otherEl.scrollLeft = scrollX;
                        }
                        
                        if (updateY &&
                            Math.round(
                                otherEl.scrollTop -
                                (scrollY = otherEl.eY =
                                 Math.round(yRate *
                                     (otherEl.scrollHeight -
                                      otherEl.clientHeight))
                                )
                            )
                        ) {
                            otherEl.scrollTop = scrollY;
                        }
                    }
                }
            }, 0
        );
    }
}