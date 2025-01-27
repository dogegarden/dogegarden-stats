let lookup = ['Live', '24h', 'Week', 'Month', 'All Time'];
let validOptions = ['Show Average','Show Minimum','Show Maximum'];
let globalVersion;

$('.dropdown-menu.keep-open').on('click', function (e) {
    e.stopPropagation();
});

window.onload = function () {
    var loadTime = window.performance.timing.domContentLoadedEventEnd-window.performance.timing.navigationStart; 
    console.log('Page load time is '+ loadTime);
    document.getElementById('loadTime').innerHTML = '<i class="fas fa-stopwatch"></i> ' + loadTime + 'ms';
    // Set start date for client
    if (window.chartConfig == undefined) {
        window.chartConfig = {
            'start': new Date().valueOf(),
            'step': 0,
            'limit': 100,
            'version' : globalVersion,
            'options' : {
                'ave' : true,
                'min' : false,
                'max' : false,
                'aveR' : true,
                'minR' : false,
                'maxR' : false
            }
        }
    };
    saveSettings(window.chartConfig);
}

function compare(previousVersion, currentVersion){
    var previousVerArr = previousVersion.split('.').map(Number); 
    var currentVerArr = currentVersion.split('.').map(Number);
  
    if (currentVerArr[0] > previousVerArr[0]) {
      return "major";
    } else if (currentVerArr[0] == previousVerArr[0] && currentVerArr[1] > previousVerArr[1]) {
      return "minor";
    } else if (currentVerArr[0] == previousVerArr[0] && currentVerArr[1] == previousVerArr[1] && currentVerArr[2] > previousVerArr[2]) {
      return "patch";
    } else {
      return "none";
    };
};

function saveSettings(settings) {
    if (localStorage && typeof settings == 'object') localStorage.setItem('dhSettings', JSON.stringify(settings));
};

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        $(".fsl").addClass('min-w');

    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen(); 
        $(".fsl").removeClass('min-w');

      }
    }
}

function readDropDownSettings() {
    document.getElementById('dropOptAve').checked = window.chartConfig.options.ave;
    document.getElementById('dropOptMin').checked = window.chartConfig.options.min;
    document.getElementById('dropOptMax').checked = window.chartConfig.options.max;
    document.getElementById('dropOptAveR').checked = window.chartConfig.options.aveR;
    document.getElementById('dropOptMinR').checked = window.chartConfig.options.minR;
    document.getElementById('dropOptMaxR').checked = window.chartConfig.options.maxR;
    // Room Chart
}

function verReload() {
    window.chartConfig.version = globalVersion;
    saveSettings(window.chartConfig);
    location.reload(true);
}

function dropdownUpdate(element) {
    document.getElementById(element.parentElement.getAttribute('aria-labelledby')).innerText = element.innerText;
    changeDataset(((element.parentElement.getAttribute('aria-labelledby') == 'userActivityChartTimeframe') ? 'statsChart' : 'roomsChart'), element.innerText)
}

function optionUpdate(element) {
    if (validOptions.indexOf(element.innerText.trim()) == -1) {
        console.log(`ERROR: Received: ${element.innerText}`);
    } else {        
        // console.log(element.parentElement.parentElement.parentElement.children[0].innerText.trim())
        // console.log(chartConfig.options["_"+element.parentElement.parentElement.parentElement.children[0].innerText.trim()])
        let canvasID = 'statsChart';
        let isRoomCheck = '';
        if (element.parentElement.getAttribute('aria-labelledby') == 'roomActivityChartOptions') {
            canvasID = 'roomsChart';
            isRoomCheck = 'R';
        }
        let configIndex = validOptions.indexOf(element.innerText.trim());
        let miniOpt = validOptions[configIndex].slice(5,8)+isRoomCheck;
        // console.log(`MiniOpt: ${miniOpt} | miniOptD: dropOpt${miniOpt}`)
        window.chartConfig.options[miniOpt.charAt(0).toLowerCase() + miniOpt.slice(1)] = document.getElementById("dropOpt"+miniOpt).checked;
        // Add or remove
        let dataName = ``;
        if (canvasID == 'statsChart') {
            dataName = 'totalOnline'
            metaIndex = 0;
            curChart = window.chart;
        } else {
            dataName = 'totalRooms'
            metaIndex = 1;
            curChart = window.chartRooms;
        }
        let isHidden = !(document.getElementById("dropOpt"+miniOpt).checked);
        curChart.data.datasets[configIndex]._meta[metaIndex].hidden = isHidden;
        saveSettings(window.chartConfig);
        curChart.update();
    }
}

function changeDataset(canvasID, value) {
    // console.log(`Canvas ${canvasID} | value ${value}`)
    let curChart;
    let lookupIndex = lookup.indexOf(value);
    let roomCheck = '';
    if (canvasID == 'statsChart') {
        curChart = window.chart;
        liveDataName = 'totalOnline';
    } else {
        curChart = window.chartRooms;
        liveDataName = 'totalRooms';
        roomCheck = 'R';
    }
    // Update chart
    // What data do we want to update
    if (lookupIndex != -1) {
        // (new Date).toLocaleTimeString()
        curChart.options.scales.xAxes[0].scaleLabel.labelString = "Time";
        if (lookupIndex > 0) {
            curChart.data.datasets[0].data = statsConfig[lookupIndex].map(({ [`ave${roomCheck}`]: val }) => val);
            curChart.data.datasets[1].data = statsConfig[lookupIndex].map(({ [`min${roomCheck}`]: val }) => val);
            curChart.data.datasets[2].data = statsConfig[lookupIndex].map(({ [`max${roomCheck}`]: val }) => val);
        } else {
            curChart.data.datasets[0].data = statsConfig[lookupIndex].map(({ [liveDataName]: val }) => val);
            curChart.data.datasets[1].data = [];   
            curChart.data.datasets[2].data = [];    
        }
    }

    if (lookupIndex == 0) {
        // Live
        curChart.data.labels = statsConfig[0].map(({ [`statsTime`]: val }) => val);
        curChart.options.scales.xAxes[0].scaleLabel.labelString = "Seconds";
        curChart.options.tooltips.callbacks.title = function(t, d) {
            return "Time: "+d.labels[t[0].index]+" seconds";
         }
        // window.chartConfig.step = 0;
        // Consider storing this data in the background
    } else if (lookupIndex == 1) {
        // 24h
        // Slice as "2021-04-18-02" is given to get day, then add hours
        curChart.data.labels = statsConfig[1].map(({ [`queryDay`]: val }) => parseInt(val.slice(-2)));
        curChart.options.tooltips.callbacks.title = function(t, d) {
            return "Time: "+d.labels[t[0].index]+" hours";
         }
    } else if (lookupIndex == 2) {
        // Weeks
        let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        curChart.data.labels = statsConfig[2].map(({ [`queryDay`]: val }) => days[new Date(val).getDay()]);
        curChart.options.tooltips.callbacks.title = function(t, d) {
            return "Time: "+d.labels[t[0].index];
         }
    } else if (lookupIndex == 3) {
        // Month
        curChart.data.labels = statsConfig[3].map(({ [`queryDay`]: val }) => new Date(val).toLocaleDateString());
        curChart.options.tooltips.callbacks.title = function(t, d) {
            return "Time: "+d.labels[t[0].index];
         }
    } else if (lookupIndex == 4) {
        // All Time
        // Store start date as value and work out day, week, month, year
        curChart.data.labels = statsConfig[4].map(({ [`queryDay`]: val }) => new Date(val).toLocaleDateString());
        curChart.options.tooltips.callbacks.title = function(t, d) {
            return "Time: "+d.labels[t[0].index];
         }
    } else {
        console.log(`Error | lookupIndex ${lookupIndex} | Input: canvasID ${canvasID} , value ${value}`);
    }
    curChart.update();
}

$(document).ready(function () {

    // Patreon Update
    // Update every now and then, patreon oauth kind of a pain to work with. May change to github sponsorships
    const users = ['Sean McGinty'];
    const activeUser = users[Math.floor(Math.random() * users.length)]
    $('#sponsor-main').text(activeUser);
    $('#sponsor-sub').text(activeUser);

    // Load settings from localStorage
    if (localStorage) {
        var savedExploitSettings = localStorage.getItem('dhSettings');
        if (savedExploitSettings != null) {
            window.chartConfig =  JSON.parse(localStorage.getItem('dhSettings'));
            window.chartConfig.start = new Date().valueOf();
            window.chartConfig.step = 0;
        }
    }

    // Get version info
    $.ajax({
        url: '/api/version?dogestats',
        success: (payload) => {
            globalVersion = payload.version;
                if (localStorage) {
                    if (savedExploitSettings != null) {
                        // Check version
                        if (window.chartConfig != null) {
                            if (window.chartConfig.version != globalVersion) {
                                // Show message to update / reload page.
                                // location.reload(true);
                                updateType = compare(window.chartConfig.version, globalVersion);
                                console.log(`Latest Version: ${globalVersion} | Current Version: ${window.chartConfig.version} | UpdateType: ${updateType}`);
                                document.getElementById("ver-alert").classList.remove("show");
                            }
                        }
                    }
                }
        } 
    })

    // [ [ live ], [ 24h - average ], [ week - average ], [ month - average ], [ alltime - average ], [ 24h - min ], [ 24h - max ], [ week - min ], [ week - max ], [ month - min ], [ month - max ], [ alltime - min ], [ alltime - max ] ]
    // window.statsConfig = [[],[],[],[],[],[],[],[],[],[],[],[],[]];
    window.statsConfig = [[],[],[],[],[]];

    function getLongTermData() {
        $.ajax({
            url: '/api/mysql?time=24h',
            success: (payload) => {
                statsConfig[1] = payload;

                // Setup
                chart.data.datasets[0]._meta[0].hidden = !window.chartConfig.options.ave;
                chart.data.datasets[1]._meta[0].hidden = !window.chartConfig.options.min;
                chart.data.datasets[2]._meta[0].hidden = !window.chartConfig.options.max;
                chartRooms.data.datasets[0]._meta[1].hidden = !window.chartConfig.options.aveR;
                chartRooms.data.datasets[1]._meta[1].hidden = !window.chartConfig.options.minR;
                chartRooms.data.datasets[2]._meta[1].hidden = !window.chartConfig.options.maxR;
                changeDataset('statsChart', '24h');
                changeDataset('roomsChart', '24h');
            }
        })
        $.ajax({
            url: '/api/mysql?time=week',
            success: (payload) => {
                statsConfig[2] = payload;
            }
        })
        $.ajax({
            url: '/api/mysql?time=month',
            success: (payload) => {
                statsConfig[3] = payload;
            }
        })
        $.ajax({
            url: '/api/mysql?time=alltime',
            success: (payload) => {
                statsConfig[4] = payload;
            }
        })
    }

    getLongTermData();

    function update() {
        $.ajax({
            url: '/api/statistics',
            success: (payload) => {
                // console.log(payload)
                // Total Rooms
                document.getElementById('roomCount').innerHTML = payload.totalRooms;
                document.getElementById('roomFix').innerText = (payload.totalRooms == 1) ? '' : 's';
                // Total Online People in all Rooms
                document.getElementById('userCount').innerHTML = payload.totalOnline;
                // Scheduled Rooms Count
                document.getElementById('scheduledCount').innerHTML = payload.totalScheduled;
                document.getElementById('scheduledFix').innerText = (payload.totalScheduled == 1) ? '' : 's';
                // Largest Room Name
                document.getElementById('topRoomName').innerHTML = payload.topRoom.name;
                document.getElementById('topUserFix').innerText = (payload.topRoom.listeners == 1) ? '' : 's';
                // Largest Room Listners
                document.getElementById('topUserCount').innerHTML = payload.topRoom.listeners;
                // Longest Room
                document.getElementById('longestRoom').innerHTML = payload.longestRoom.name;
                document.getElementById('longestUserCount').innerHTML = payload.longestRoom.listeners;
                document.getElementById('longestUserFix').innerText = (payload.longestRoom.listeners == 1) ? '' : 's';
                // Newest Room
                document.getElementById('newestRoom').innerHTML = payload.newestRoom.name;
                document.getElementById('newestUserCount').innerHTML = payload.newestRoom.listeners;
                document.getElementById('newestUserFix').innerText = (payload.newestRoom.listeners == 1) ? '' : 's';
                document.getElementById('botsProvidingTelem').innerHTML = payload.totalBotsSendingTelemetry + '/' + payload.totalBotsOnline + ' bots providing telemetry via <a href="https://github.com/dogegarden/dogehouse.js">dogehouse.js</a> & <a href="https://github.com/Arthurdw/dogehouse.py">dogehouse.py</>'

                if (payload.totalBotsOnline == 1) {
                    document.getElementById('botsOnline').innerHTML = payload.totalBotsOnline + ' Bot Online';
                } else if (payload.totalBotsOnline == 0) {
                    document.getElementById('botsOnline').innerHTML = 'No bots online :(';
                } else {
                    document.getElementById('botsOnline').innerHTML = payload.totalBotsOnline + ' Bots Online';
                }


                // Get room status 
                function getStatus(element, payloadCreation) {

                    let currentTime = new Date().valueOf()
                    // let serverOffset = (1000*60*60*-12)
                    let roomCreation = new Date(payloadCreation).valueOf();
                    // let timeDiff = (currentTime - roomCreation - serverOffset) / (1000 * 60) ; // minutes
                    let timeDiff = (currentTime - roomCreation) / (1000 * 60); // minutes

                    // let timeDiffHours = timeDiff / 60
                    // let shortenedText = ~~timeDiffHours;

                    // shortenedText === 24 ? shortenedText = 0 :  console.log(shortenedText)

                    // let minutes = ~~((timeDiffHours - ~~timeDiffHours) * 60)
                    // let days = 0;
                    // if (timeDiffHours > 23) {
                    //     days = ~~(timeDiff / 60 / 24);
                    // }
                    // let hours = shortenedText - days * 24;

                    let days = ~~(timeDiff / 60 / 24)
                    let minutes = ~~(timeDiff % 60)
                    let hours = ~~(timeDiff / 60 % 24)

                    function changeText(text = 'Generating...') {

                        element.innerHTML = text + " (" + (days === 0 ? "" : "Days: " + days + " | ") + "Hours: " + hours + " | Minutes: " + minutes + ")";

                        // shortened text is 217

                    }

                    switch (true) {

                        case (timeDiff < 30): {
                            changeText("⛽️ Fueling Rocket")
                            break;
                        }
                        case (timeDiff < 60): {
                            changeText("🚀 Taking Off")
                            break;
                        }
                        case (timeDiff < 240): {
                            changeText("🚀✨ In Space")
                            break;
                        }
                        case (timeDiff < 480): {
                            changeText("🚀🌕 Approaching Moon")
                            break;
                        }
                        case (timeDiff < 1440): {
                            changeText("🌕🐕 Lunar Doge")
                            break;
                        }
                        case (timeDiff < 2880): {
                            changeText("🚀☀️ Approaching Sun")
                            break;
                        }
                        case (timeDiff < 5760): {
                            changeText("☀️🐕 Solar Doge")
                            break;
                        }
                        case (timeDiff < 11520): {
                            changeText("🚀🌌 Approaching Galaxy")
                            break;
                        }
                        case (timeDiff < 23040): {
                            changeText("🌌🐕 Galatic Doge")
                            break;
                        }
                        case (timeDiff < 23041): {
                            changeText("🪐👾 Spotted Life")
                            break;
                        }
                    }

                }
                getStatus(document.getElementById('timeOnline'), payload.topRoom.created_at)
                getStatus(document.getElementById('newestTimeOnline'), payload.newestRoom.created_at)
                getStatus(document.getElementById('longestTimeOnline'), payload.longestRoom.created_at)

                // Read settings
                readDropDownSettings();

                // Stats config
                statsConfig[0].push({
                    'totalRooms' : payload.totalRooms,
                    'totalOnline' : payload.totalOnline,
                    'statsTime' : window.chartConfig.step * 5
                });

                window.chartConfig.step++;
                var time = window.chartConfig.step * 5;
                
                // Check for removal
                if (window.chart.data.datasets[0].data.length >= window.chartConfig.limit) {
                    window.chart.data.datasets[0].data = window.chart.data.datasets[0].data.slice(1);
                }
                if (statsConfig.length >= window.chartConfig.limit) {
                    statsConfig[0] = statsConfig[0].slice(1);
                }

                // User Acitivty Chart
                changeDataset('statsChart',document.getElementById("userActivityChartTimeframe").innerText.trim())

                // Room Acitivty Chart
                changeDataset('roomsChart',document.getElementById("roomActivityChartTimeframe").innerText.trim())

                // Update
                window.chart.update();
                window.chartRooms.update();

                var userRoomChart = document.getElementById("botuserChart");
                var userRoomData = {
                    labels: [
                        "Users Online",
                        "Bots Online"
                    ],
                    datasets: [
                        
                        {
                            borderColor: false,
                            data: [payload.totalOnline - payload.totalBotsOnline, payload.totalBotsOnline],
                            backgroundColor: [
                                "rgba(244, 5, 95, 0.55)",
                                "rgba(5, 89, 244, 0.55)",
                                "rgba(244, 140, 5, 0.55)"
                            ]
                        }]
                };
        
                let UserBotChart = new Chart(userRoomChart, {
                type: 'doughnut',
                data: userRoomData,
                options: {
                    animation: false,
                    legend: {
                        color: '#cacaca'
                    },
                    defaultFontColor: '#000'
                }
                });

                // rooms / users
                var userRoomChart = document.getElementById("userroomChart");
                var userRoomData = {
                    labels: [
                        "Users Online",
                        "Rooms",
                        "Bots Online"
                    ],
                    datasets: [
                        
                        {
                            borderColor: false,
                            data: [payload.totalOnline - payload.totalBotsOnline, payload.totalRooms, payload.totalBotsOnline],
                            backgroundColor: [
                                "rgba(244, 5, 95, 0.55)",
                                "rgba(5, 89, 244, 0.55)",
                                "rgba(244, 140, 5, 0.55)"
                            ]
                        }]
                };
        
                let UserRoomDoughnutChart = new Chart(userRoomChart, {
                type: 'doughnut',
                data: userRoomData,
                options: {
                    segmentShowStroke: false,
                    animation: false,
                    legend: {
                        color: '#cacaca'
                    },
                }
                });

            }
        });
        $.ajax({
            url: '/api/bots',
            success: (payload) => {
            if (payload.bots != undefined) {
                // console.log(payload)
                let uniqueBots = [];
                for (let i = 0; i < payload.bots.length; i++) {
                    if (payload.bots[i].bot != undefined) {
                        uniqueBots.push(payload.bots[i]);
                    }
                }
                // console.log(uniqueBots)
                if (document.getElementsByClassName("uuid").length > uniqueBots.length) {
                    // Remove all for now
                    document.getElementById('testBots').innerHTML = "";
                }
                for (i = 0; i < uniqueBots.length; i++) {
                    var botExists = false;
                    if (document.getElementById("testBots").innerText.indexOf(uniqueBots[i].bot.uuid) == -1) {
                        document.getElementById('testBots').innerHTML +=
                            `<a target="_blank"${(uniqueBots[i].room.uuid == null) ? '' : ' href="https://dogehouse.tv/room/' + uniqueBots[i].room.uuid + '"'}>
                        <div class="card accounts-card">
                            <div class="card-body border-r">
                                <div class="con-grid1">
                                    <img class="account-avatar" src="${uniqueBots[i].bot.avatar}">
                                    <div class="account-text" style="line-height: 15px; text-align: left;">
                                    ${uniqueBots[i].bot.username}<br>
                                        <span class="uuid" style="font-size: 10px; --tw-text-opacity: 1; color: rgba(154.148,165.363,177.352,var(--tw-text-opacity));">${uniqueBots[i].bot.uuid}</span>
                                        <i style="font-size: 1rem; display: block;">${(uniqueBots[i].room.name == null) ? "" : uniqueBots[i].room.name}</i>

                                        </div>

                                    <div class="right-col-rooms">
                                      <i class="fas fa-user-friends" aria-hidden="true"></i> ${(uniqueBots[i].room.listening == null) ? 0 : uniqueBots[i].room.listening}
                                    </div>
                                </div>
                                <br><br>
                            </div>
                        </div>
                    </a><br>`
                    }
                    for (let j = 0; j < uniqueBots.length; j++) {
                        if (document.getElementsByClassName("uuid")[j] != undefined) {
                            if (uniqueBots[i].bot.uuid == document.getElementsByClassName("uuid")[j].innerText) {
                                botExists = true;
                                document.getElementsByClassName("uuid")[j].parentElement.parentElement.children[2].innerHTML = `<i class="fas fa-user-friends" aria-hidden="true"></i> ` + ((uniqueBots[i].room.listening == "No Room") ? 0 : uniqueBots[i].room.listening);
                                document.getElementsByClassName("uuid")[j].parentElement.children[2].innerText = (uniqueBots[i].room.name == null) ? "" : uniqueBots[i].room.name;
                                // document.getElementsByClassName("uuid")[j].parentElement.parentElement.children[0].src = uniqueBots[i].bot.avatar;
                            }
                        }
                    }
                    if (i == (uniqueBots.length - 1) && botExists == false) {
                        document.getElementById('testBots').children[i].remove();
                        document.getElementById('testBots').children[i].remove();
                    }
                }
            }
          }
        })
    }

    function checkAPIStatus() {
        try {
            $.ajax({
                url: 'https://api.dogegarden.net',
                timeout: 1500,
                error: function() {
                    $("#api-alert").removeClass('show');
                },
            })
        } catch(err) {
            //no 1 cares about err so we ignore it :)
        }
    }
    checkAPIStatus()
    update();
    setInterval(update, 5000);
    setInterval(checkAPIStatus, 10000);
});
