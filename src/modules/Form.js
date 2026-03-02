
const Form = () => {

   // "use strict";


   // Define aliases
   const d = document;


   // Define variables

   const numFields = d.querySelectorAll('.field').length;
   const nextButton = d.getElementById("next");
   const prevButton = d.getElementById("prev");

   // Prevent duplicate clicks
   let isClickable = true;


   function initForm() {

      // Reset form on load
      d.getElementById("form").reset();

      // Index fields
      let i = 1;
      d.querySelectorAll('.field').forEach(field => field.setAttribute('data-field-index', i++));

      // Set first field as current
      d.querySelectorAll('.field')[0].classList.add('current-field');

      // Set first index
      let currentFieldIndex = 1;
      let currentField = d.querySelector('[data-field-index="' + currentFieldIndex + '"]');

      // Show first field
      d.querySelector('[data-field-index="1"]').style.display = 'block';

      // Focus first field input
      if (d.body.getAttribute('data-device') == 'desktop') {
         const firstFieldInput = currentField.querySelector('input, textarea');
         if (firstFieldInput) firstFieldInput.focus();
      }

      // Prevent default on all buttons within the form
      d.querySelectorAll('button').forEach(formButton => {
         formButton.addEventListener('click', function (e) {
            e.preventDefault();
         });
      });

      updateNavigation();

      // Init prev/next navigatoin listeners
      nextButton.addEventListener("click", function () { if (isClickable) traverseForward() });
      prevButton.addEventListener("click", function () { if (isClickable) traverseBack() });


      //


      // Form traversal functions

      function traverseBack() {

         if (traversalValidation('prev')) {

            isClickable = false;

            currentField.classList.remove('current-field');
            currentField.classList.add('hidden-next');
            currentField.classList.remove('hidden-previous');

            d.querySelector('[data-field-index="' + (currentFieldIndex - 1) + '"]').style.display = 'block';

            currentFieldIndex--;
            currentField = d.querySelector('[data-field-index="' + currentFieldIndex + '"]');

            setTimeout(function () {

               currentField.classList.remove('hidden-previous');
               currentField.classList.add('current-field');

               if (d.body.getAttribute('data-device') == 'desktop') {
                  const focusableField = currentField.querySelector('input, textarea');
                  if (focusableField) focusableField.focus();
               }

               hideFields();

               updateNavigation();

               isClickable = true;

            }, 300);

         }

      } // traverseBackward();

      function traverseForward() {

         if (traversalValidation('next')) {

            isClickable = false;

            currentField.classList.remove('current-field');
            currentField.classList.remove('hidden-next');
            currentField.classList.add('hidden-previous');

            d.querySelector('[data-field-index="' + (currentFieldIndex + 1) + '"]').style.display = 'block';

            currentFieldIndex++;
            currentField = d.querySelector('[data-field-index="' + currentFieldIndex + '"]');

            setTimeout(function () {

               currentField.classList.remove('hidden-next');
               currentField.classList.add('current-field');

               if (d.body.getAttribute('data-device') == 'desktop') {
                  const focusableField = currentField.querySelector('input, textarea');
                  if (focusableField) focusableField.focus();
               }

               hideFields();

               updateNavigation();

               isClickable = true;

            }, 300);

         }

      } // traverseForward()

      function updateNavigation() {

         // Update prev/next navigation buttons state when traversing

         currentFieldIndex == 1 ? prevButton.classList.add('disabled') : prevButton.classList.remove('disabled');
         currentFieldIndex == numFields ? nextButton.classList.add('disabled') : nextButton.classList.remove('disabled');

      } // updateNavigation()

      function hideFields() {

         d.querySelectorAll('.hidden-previous, .hidden-next').forEach(hiddenField => hiddenField.style.display = 'none');

      } // hideFields();

      function traversalValidation(dir) {

         // Check traversal direction and allow 
         // traversal, if there are prior or 
         // subsequent fields to traverse to.

         // If traversal is forward, run check for required field poopulation

         if (dir == 'prev') {

            let nextIndex = currentFieldIndex - 1;

            return (nextIndex == 0) ? false : true;

         }

         if (dir == 'next') {

            let nextIndex = currentFieldIndex + 1;

            if (requirementCheck()) {

               return (nextIndex == numFields + 1) ? false : true;

            }

         }

      } // traversalValidation()

      function requirementCheck() {

         // Check if current field is required, and if so, if it is populated,
         // if all is true, return true to traversalValidations().

         const currentFieldObj = d.querySelector('[data-field-index="' + currentFieldIndex + '"]');
         const currentFieldIsRequired = currentFieldObj.classList.contains('required');
         const currentFieldIsPopulated = currentFieldObj.classList.contains('populated');
         const currentFieldRequiredNotice = currentFieldObj.getAttribute('data-required-notice');

         if (currentFieldIsRequired && !currentFieldIsPopulated) {

            if (currentFieldRequiredNotice !== '' && currentFieldRequiredNotice !== null) {

               alert('Üzgünüz, bu alan zorunludur.\n\n' + currentFieldRequiredNotice);

            } else {

               alert('Üzgünüz, bu alan zorunludur.');

            }

            return;

         } else {

            return true;

         }

      } // requirementCheck()


      // Handlers

      function proceedButtonHandler() {

         d.querySelectorAll('.proceed-button').forEach(proceedButton => {
            proceedButton.addEventListener('click', function () {
               traverseForward();
            });
         });

      } // proceedButtonHandler()

      function addInputHandler() {

         d.querySelectorAll('.add-input-button').forEach(addInputButton => {

            let inputParent = addInputButton.parentElement;

            let currentInputNumber = 1;
            const maxInputs = 5;

            addInputButton.addEventListener('click', function () {

               // Disable button when max inputs is reached
               if (this.parentElement.querySelectorAll('input[type="text"]').length == maxInputs - 1) {
                  addInputButton.classList.add('disabled');
               }

               // Alert if more is attempted (not used as the buttons disabled)
               if (this.parentElement.querySelectorAll('input[type="text"]').length >= maxInputs) {
                  alert("Üzgünüz, burada izin verilen maksimum alan sayısına ulaşıldı.");
                  return;
               }

               const originalInput = this.parentElement.querySelector('input[type="text"]');

               const inputClone = originalInput.cloneNode(true);
               inputClone.id = originalInput.id + '-' + currentInputNumber;

               originalInput.parentElement.insertBefore(inputClone, addInputButton);

               // clear value
               inputClone.value = '';


               //

               const removeInputButton = d.createElement('a');
               removeInputButton.classList.add('remove-input-button');
               removeInputButton.setAttribute('data-input-index', currentInputNumber);
               inputClone.setAttribute('data-input-index', currentInputNumber);
               inputClone.parentElement.insertBefore(removeInputButton, inputClone.nextElementSibling);

               if (d.body.getAttribute('data-device') == 'desktop') {
                  inputClone.focus();
               }

               removeInputButton.addEventListener('click', function () {

                  const thisIndex = this.getAttribute('data-input-index');

                  d.querySelectorAll('[data-input-index="' + thisIndex + '"]')[0].remove();

                  if (inputParent.querySelectorAll('input[type="text"]').length < maxInputs) {
                     addInputButton.classList.remove('disabled');
                  }

                  this.remove();

                  if (inputParent.classList.contains('required')) multiInputPopulationCheck(inputParent);

               });

               currentInputNumber++;

               if (inputParent.classList.contains('required')) multiInputPopulationCheck(inputParent);

            });

         });

      } // addInputHandler()

      function requiredFieldsHandler() {

         const requiredFields = d.querySelectorAll('.field.required');

         requiredFields.forEach(requiredField => {

            requiredField.querySelector('.proceed-button').classList.add('disabled');


            // Required Text Input

            if (requiredField.classList.contains('text-input-field')) {

               const thisTextInput = requiredField.querySelector('input');

               thisTextInput.addEventListener('keyup', function () {

                  if (thisTextInput.value !== '') {

                     requiredField.querySelector('.proceed-button').classList.remove('disabled');
                     requiredField.classList.add('populated');

                  } else {

                     requiredField.querySelector('.proceed-button').classList.add('disabled');
                     requiredField.classList.remove('populated');

                  }

               });

            }


            // Required Textarea

            if (requiredField.classList.contains('textarea-field')) {

               const thisTextarea = requiredField.querySelector('textarea');

               thisTextarea.addEventListener('keyup', function () {

                  if (thisTextarea.value !== '') {

                     requiredField.querySelector('.proceed-button').classList.remove('disabled');
                     requiredField.classList.add('populated');

                  } else {

                     requiredField.querySelector('.proceed-button').classList.add('disabled');
                     requiredField.classList.remove('populated');

                  }

               });

            }


            // Required Radio Group 

            if (requiredField.classList.contains('radio-button-field')) {

               const radioInputs = requiredField.querySelectorAll('input[type="radio"]');

               radioInputs.forEach(radioInput => {

                  radioInput.addEventListener('click', function () {

                     if (radioInput.checked) {

                        requiredField.querySelector('.proceed-button').classList.remove('disabled');
                        requiredField.classList.add('populated');

                     }

                  });

               });

            }


            // Required Multi Input Field

            if (requiredField.classList.contains('multi-input-field')) {

               requiredField.addEventListener('keyup', function () {

                  multiInputPopulationCheck(requiredField);

               })

            }


            // Required Conditional Input Field

            if (requiredField.classList.contains('conditional-input-field')) {

               requiredField.addEventListener('keyup', function (e) {

                  if (e.target.type == 'text' || e.target.type == 'textarea') {
                     conditionalInputPopulationCheck(requiredField);
                  }

               })

               requiredField.addEventListener('change', function (e) {

                  if (e.target.type == 'radio') {
                     conditionalInputPopulationCheck(requiredField);
                  }

               })

            }


         });

      } // requiredFieldsHandler()

      function multiInputPopulationCheck(field) {

         // Get all current inputs within field
         const childInputs = field.querySelectorAll('input[type="text"]');

         const isEmpty = Array.from(childInputs).some(input => input.value.trim() === '');

         if (isEmpty) {

            field.classList.remove('populated')
            field.querySelector('.proceed-button').classList.add('disabled');

         } else {

            field.classList.add('populated');
            field.querySelector('.proceed-button').classList.remove('disabled');

         }

      } // multiInputPopulationCheck()

      function conditionalFieldsHAndler() {

         const conditionalFields = d.querySelectorAll('.field.conditional-input-field');

         conditionalFields.forEach(field => {

            const radioInputs = field.querySelectorAll('input[type="radio"]');
            const conditionalnput = field.querySelectorAll('.conditional-input-form-field')[0];

            radioInputs.forEach(radioInput => {
               radioInput.addEventListener('change', function () {

                  if (radioInput.classList.contains('is-trigger')) {

                     field.querySelector('.conditional-input').classList.remove('hidden');
                     if (d.body.getAttribute('data-device') == 'desktop') {
                        conditionalnput.focus();
                     }

                  } else {

                     field.querySelector('.conditional-input').classList.add('hidden');

                  }

               });
            });


         });


      } // conditionalFieldsHAndler()

      function conditionalInputPopulationCheck(field) {

         // if checked radio button is NOT TRIGGER -- pass
         const isNotTrigger = !field.querySelector('input[type="radio"]:checked').classList.contains('is-trigger');
         if (isNotTrigger) {

            field.classList.add('populated');
            field.querySelector('.proceed-button').classList.remove('disabled');

            return;

         } else {

            field.classList.remove('populated');
            field.querySelector('.proceed-button').classList.add('disabled');

            // Checked Radio is Trigger, so check conditional input form field is populated
            if (field.querySelector('.conditional-input-form-field').value !== '') {

               field.classList.add('populated');
               field.querySelector('.proceed-button').classList.remove('disabled');

            } else {

               field.classList.remove('populated');
               field.querySelector('.proceed-button').classList.add('disabled');

            }

         }

      } // conditionalInputPopulationCheck()

      function skippableHandler() {

         // detect if field has been changed and is not empty
         // if so remove skippable class, else replace skippable class..

         const skippableFields = d.querySelectorAll('.skippable');

         skippableFields.forEach(skippableField => {


            // Skippable Text Input

            if (skippableField.classList.contains('text-input-field')) {

               const thisTextInput = skippableField.querySelector('input');

               thisTextInput.addEventListener('keyup', function () {

                  if (thisTextInput.value !== '') {

                     skippableField.classList.remove('skippable');

                  } else {

                     if (!skippableField.classList.contains('skippable')) {
                        skippableField.classList.add('skippable');
                     }

                  }

               });

            }


            // Skippable Textarea

            if (skippableField.classList.contains('textarea-field')) {

               const thisTextarea = skippableField.querySelector('textarea');

               thisTextarea.addEventListener('keyup', function () {

                  if (thisTextarea.value !== '') {

                     skippableField.classList.remove('skippable');

                  } else {

                     if (!skippableField.classList.contains('skippable')) {
                        skippableField.classList.add('skippable');
                     }

                  }

               });

            }


            // Skippable Radio Group 

            if (skippableField.classList.contains('radio-button-field')) {

               const radioInputs = skippableField.querySelectorAll('input[type="radio"]');

               radioInputs.forEach(radioInput => {

                  radioInput.addEventListener('click', function () {

                     if (radioInput.checked) {

                        skippableField.classList.remove('skippable');

                     }

                  });

               });

            }


            // Skippable Multi Input Field

            if (skippableField.classList.contains('multi-input-field')) {

               skippableField.addEventListener('keyup', function () {

                  checkChildInputs(skippableField);

               })

               skippableField.addEventListener('click', function () {

                  checkChildInputs(skippableField);

               })

               function checkChildInputs(skippableField) {

                  let childInputs = skippableField.querySelectorAll('input[type="text"]');

                  childInputs.forEach(childInput => {

                     if (childInput.value !== '' && !childInput.classList.contains('child-populated')) {
                        childInput.classList.add('child-populated')
                     }

                     if (childInput.value == '' && childInput.classList.contains('child-populated')) {
                        childInput.classList.remove('child-populated')
                     }

                  });

                  if (skippableField.querySelectorAll('.child-populated').length == 0) {

                     if (!skippableField.classList.contains('skippable')) {
                        skippableField.classList.add('skippable')
                     }

                  } else {

                     if (skippableField.classList.contains('skippable')) {
                        skippableField.classList.remove('skippable')
                     }

                  }

               }

            }


            // Skippable Conditional Input Field // TODO: Rectify Lazy Validation :/

            if (skippableField.classList.contains('conditional-input-field')) {

               skippableField.addEventListener('keyup', function (e) {

                  if (e.target.type == 'text' || e.target.type == 'textarea') {

                     skippableField.classList.remove('skippable');

                  } else {

                     if (!skippableField.classList.contains('skippable')) {
                        skippableField.classList.add('skippable');
                     }

                  }

               })

               skippableField.addEventListener('change', function (e) {

                  if (e.target.type == 'radio') {

                     skippableField.classList.remove('skippable');

                  } else {

                     if (!skippableField.classList.contains('skippable')) {
                        skippableField.classList.add('skippable');
                     }

                  }

               })

            }

         });

      } // skippableHandler()

      // Form Submission
      function formSubmissionHandler() {

         const submitButton = d.getElementById('submit-form-button');

         submitButton.addEventListener('click', function () {

            const formFields = d.querySelectorAll('.field');

            const formValues = [];


            // Iterate through each form field
            formFields.forEach(formField => {

               // iterate through each conditional input and grab values
               if (formField.classList.contains('conditional-input-field')) {

                  // iterate through each radio input and grab values
                  const formFieldRadioInputs = formField.querySelectorAll('input[type="radio"]:checked');
                  formFieldRadioInputs.forEach(formFieldRadioInput => {

                     formValues.push([formFieldRadioInput.getAttribute('data-output-name'), formFieldRadioInput.getAttribute('data-option-name')]);

                  });

               }


               let multiInputCounter = 1;

               // iterate through each text input and grab values
               const formFieldTextInputs = formField.querySelectorAll('input[type="text"]');

               formFieldTextInputs.forEach(formFieldTextInput => {

                  // If it's a multi input add count to output name
                  if (formField.classList.contains('multi-input-field')) {

                     formValues.push([formFieldTextInput.getAttribute('data-output-name') + ' ' + multiInputCounter, formFieldTextInput.value]);
                     multiInputCounter++;

                  } else {

                     // If it's a conditional input field, output the conditional field value if triggered
                     if (!formFieldTextInput.parentElement.classList.contains('hidden')) {

                        formValues.push([formFieldTextInput.getAttribute('data-output-name'), formFieldTextInput.value]);

                     }

                  }

               });

               // iterate through each textarea input and grab values
               const formFieldTextareaInputs = formField.querySelectorAll('textarea');
               formFieldTextareaInputs.forEach(formFieldTextareaInput => {
                  formValues.push([formFieldTextareaInput.getAttribute('data-output-name'), formFieldTextareaInput.value]);
               });

               if (formField.classList.contains('radio-button-field')) {

                  // iterate through each radio input and grab values
                  const formFieldRadioInputs = formField.querySelectorAll('input[type="radio"]:checked');
                  formFieldRadioInputs.forEach(formFieldRadioInput => {
                     formValues.push([formFieldRadioInput.getAttribute('data-output-name'), formFieldRadioInput.getAttribute('data-option-name')]);
                  });

               }

            });

            formValues.push(['Client Name', d.getElementById('primary-contact-name').value]);
            formValues.push(['Project Type', d.getElementById('project-type').value]);

            sendValues(formValues);

         });

         function sendValues(formValues) {

            // Add form sent class
            d.querySelector('.submit-form-field').classList.add('form-sent');

            // Hide navigation buttons
            d.getElementById('form-navigation').classList.add('hide');

            // Hdie & Remove Submit Message
            const submitMessage = d.getElementById("submit-message");
            submitMessage.classList.add('hide');

            setTimeout(function () {

               submitMessage.remove();

               const formData = new FormData();

               formData.append("formValues", JSON.stringify(formValues));

               // Create an XMLHttpRequest object
               const xhr = new XMLHttpRequest();

               // Define the request parameters
               xhr.open("POST", "process.php", true);

               // Set up the onload event handler
               xhr.onload = function () {

                  if (xhr.status === 200) {

                     const result = d.getElementById("result");
                     result.innerHTML = xhr.responseText;

                     setTimeout(function () {
                        result.classList.add('show');
                     }, 325)

                  }

               };

               // Send the request
               xhr.send(formData);

            }, 325);

         }

      } // formSubmissionHandler()


      // Init handlers

      requiredFieldsHandler();
      proceedButtonHandler();
      addInputHandler();
      conditionalFieldsHAndler();
      skippableHandler();
      formSubmissionHandler();

   } // initForm()   

   // init

   initForm();

}

export default Form;