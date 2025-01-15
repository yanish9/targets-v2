function factoryReset() {

if (confirm("This will delete all current Schedules. Do you want to proceed?")) {

        fetch('/factory-reset')
            .then(response => response.json())
            .then({
        setTimeout(() => {
                location.reload();
}, 2000)

})

                }
            }
