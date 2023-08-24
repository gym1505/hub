const baseApiUrl = "https://codeforces.com/api/";
var estimatedUserRating = 0;

// TODO: обрабатывать ошибки из fetch
// TODO: анимация загрузки на кнопке

// Google Charts embed constants
google.charts.load('current', { 'packages': ['corechart', 'calendar'] });

var googleChartColors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#2196F3', '#009688',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B', '#E65100',
    '#827717', '#004D40', '#1A237E', '#6200EA', '#3F51B5', '#F50057', '#304FFE', '#b71c1c'];


function resetPage() {
    document.getElementById("handle_display").textContent = "";

    document.getElementById("Easy").textContent = "";
    document.getElementById("Medium").textContent = "";
    document.getElementById("Hard").textContent = "";

    document.getElementById("rank_display").textContent = "";
    document.getElementById("rating_display").textContent = "";
    document.getElementById("max_rank_display").textContent = "";
    document.getElementById("max_rating_display").textContent = "";
    
    document.getElementById("alert_message").style.display = "none";
    document.getElementById("display_block").style.display = "none";

    estimatedUserRating = 0;
}


class Problem {
    constructor(index, name, attempted, success) {
        this.index = index;
        this.name = name;
        if (attempted && success) {
            this.verdict = "Accepted";
            this.css = "accepted"
        } else if (attempted) {
            this.verdict = "Failed";
            this.css = "failed"
        } else {
            this.verdict = "Not Attempted"
            this.css = "notattempted"
        }
    }
}


class Contest {
    constructor(data) {
        var problems = data.problems;
        var rows = data.rows;

        this.problems = [];
        for (var i = 0; i < problems.length; i++) {
            var attempted = false;
            var success = false;
            for (var j = 0; j < rows.length; j++) {
                if (rows[j].problemResults[i].bestSubmissionTimeSeconds) {
                    attempted = true;
                    success = true;
                    break;
                }
                else if (rows[j].problemResults[i].rejectedAttemptCount > 0) {
                    attempted = true;
                }
            }

            this.problems.push(new Problem(problems[i].index, problems[i].name, attempted, success))
        }
    }
}


function easyLow(x) {
    return x - 200;
}


function easyHigh(x) {
    return x;
}


function mediumLow(x) {
    return x;
}


function mediumHigh(x) {
    return Math.min(3500, x + 200);
}


function hardLow(x) {
    return Math.min(3500, x + 200);
}


function hardHigh(x) {
    return Math.min(3500, x + 500);
}


async function displayProblemsInContest(handle, contestId) {
    let url = baseApiUrl + "contest.standings?handles="
              + handle + "&contestId=" + contestId
              + "&showUnofficial=true&lang=ru";

    const response = await fetch(url);
    const data = (await response.json())["result"];

    var contest = new Contest(data);

    for (var x of contest.problems) {
        document.getElementById(contestId).innerHTML += ('<tr class="' + x.css + '">' +
            '<td>' + x.index + '</td>' +
            '<td>' + x.name + '</td>' +
            '<td>' + x.verdict + '</td>' +
            '</tr>');
    }
}


function displayContests(handle, contestList) {
    var count = 0;

    for (const displayedContest of document.querySelectorAll("#contestlist > div")) {
        displayedContest.remove();
    }

    for (var x of contestList) {
        if (++count > 3) break;
        document.getElementById('contestlist').innerHTML += (
            '<div class="card">'
            + '<div class="card-body">'
            + '<h4><a href="https://codeforces.com/contest/'
            + x.contestId + '">' + x.contestName + '</a></h4>'
            + '<table class="table table-bordered">'
            + '<tbody id="' + x.contestId + '">'
            + '</tbody>'
            + '</table>'
            + '</div>'
            + '</div>');

        displayProblemsInContest(handle, x.contestId);
    }
}

async function fetchDataFromCodeforcesAPI(handle) { // use with .then() in main code
    const [submissionsResponse, problemsetResponse, infoResponse, contestsResponse] = await Promise.all([
        fetch(baseApiUrl + "user.status?lang=ru&handle=" + handle),
        fetch(baseApiUrl + "problemset.problems?lang=ru"),
        fetch(baseApiUrl + "user.info?lang=ru&handles=" + handle),
        fetch(baseApiUrl + "user.rating?lang=ru&handle=" + handle)
    ]);

    let userExists = (infoResponse.statusText == "OK");

    if (!userExists) return [false, {}, {}, {}];

    const submissions = (await submissionsResponse.json())["result"];
    const problemset = (await problemsetResponse.json())["result"];
    const info = (await infoResponse.json())["result"][0];
    const contests = (await contestsResponse.json())["result"];

    return [userExists, submissions, problemset, info, contests];
}


function getAttemptedProblems(userSubmissions) {
    var attemptedProblems = [];

    for (var i = 0; i < userSubmissions.length; i++) {
        var uniqueProblemRepresentation = userSubmissions[i].problem.contestId + "_" + userSubmissions[i].problem.name;

        if (!attemptedProblems.includes(uniqueProblemRepresentation)) {
            attemptedProblems.push(uniqueProblemRepresentation);
        }
    }

    return attemptedProblems;
}


function parseSubmissionsIntoTags(userSubmissions) {
    var userAcceptedTags = {};
    var userAttemptedProblems = [];

    for (var i = 0; i < userSubmissions.length; i++) {
        if (userAttemptedProblems.includes(userSubmissions[i].problem.contestId + "_" + userSubmissions[i].problem.name)) continue;
        userAttemptedProblems.push(userSubmissions[i].problem.contestId + "_" + userSubmissions[i].problem.name); // Array of attempted problems, with problems defined as 'contestId_NameOfProb'
        var currentProblemTags = userSubmissions[i].problem.tags; // all tags associated with the problem
        for (var t = 0; t < currentProblemTags.length; t++) {
            if (userSubmissions[i].verdict == 'OK') {
                if (userAcceptedTags[currentProblemTags[t]] === undefined) userAcceptedTags[currentProblemTags[t]] = 1;
                else userAcceptedTags[currentProblemTags[t]]++;
            }
        }
    }

    return userAcceptedTags;
}


function capitalize(string) {
    return string.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}


function displayUserProfile(userInformation, contestList) {
    var currentRating = userInformation["rating"];
    var currentRank = userInformation["rank"];
    var maxRating = userInformation["maxRating"];
    var maxRank = userInformation["maxRank"];

    console.log(userInformation);

    document.getElementById("rank_display").innerHTML = "";

    var rankColorReference = {
        "не в рейтинге": 'white',
        "новичок": 'gray',
        "ученик": 'green',
        "специалист": '#03a89e',
        "эксперт": 'blue',
        "кандидат в мастера": 'violet',
        "мастер": 'orange',
        "международный мастер": 'orange',
        "гроссмейстер": 'red',
        "международный гроссмейстер": 'red',
        "легендарный гроссмейстер": 'red'
    };

    if (contestList.length == 0) {
        maxRank = "не в рейтинге";
        currentRank = "не в рейтинге";
        maxRating = "N/A";
        currentRating = "N/A";
    }

    // setting colors
    document.getElementById("max_rating_display").style.color = rankColorReference[maxRank];
    document.getElementById("max_rank_display").style.color = rankColorReference[maxRank];
    document.getElementById("rating_display").style.color = rankColorReference[currentRank];
    document.getElementById("rank_display").style.color = rankColorReference[currentRank];

    // setting values
    document.getElementById("max_rating_display").innerHTML = maxRating;
    document.getElementById("max_rank_display").innerHTML = "(" + capitalize(maxRank) + ")";
    document.getElementById("rating_display").innerHTML = currentRating;
    document.getElementById("rank_display").innerHTML = "(" + capitalize(currentRank) + ")";
}


function displayProblemCards(completeProblemSet, userSubmits) {
    // Function to print recommended problems of all tags

    var totalNoProb = completeProblemSet.length;
    var setOfProb = new Set(); // To store and search the problems being recommended
    var getProblemUrl = "https://codeforces.com/contest/";
    var notAttemptedProblems = [];

    // Creates array of problems, of the tag provided in input, NOT attempted by the user
    for (var i = 0; i < totalNoProb; i++) {
        if (!userSubmits.includes(completeProblemSet[i].contestId + "_" + completeProblemSet[i].name)) {
            notAttemptedProblems.push(completeProblemSet[i]);
        }
    }

    completeProblemSet = notAttemptedProblems; // Modifies completeProblemSet to contain only those problems NOT attempted by the user
    totalNoProb = completeProblemSet.length;

    let problemDifficultyLevels = ["Easy", "Medium", "Hard"];

    var roundRatingDelta = estimatedUserRating % 100 // finding the rounded user rating
    if (roundRatingDelta < 50) roundRatingDelta = estimatedUserRating - roundRatingDelta;
    else roundRatingDelta = estimatedUserRating - roundRatingDelta + 100;

    roundRatingDelta = Math.max(800, roundRatingDelta)
    roundRatingDelta = Math.min(3500, roundRatingDelta);


    for (var currentProblemDifficultyLevel of problemDifficultyLevels) {
        var low, high;
        if (currentProblemDifficultyLevel == "Easy") {
            low = easyLow(roundRatingDelta);
            high = easyHigh(roundRatingDelta);
        }
        else if (currentProblemDifficultyLevel == "Medium") {
            low = mediumLow(roundRatingDelta);
            high = mediumHigh(roundRatingDelta);
        }
        else {
            low = hardLow(roundRatingDelta);
            high = hardHigh(roundRatingDelta);
        }

        // Generate five random problems
        var checks = 0;
        var ctr = 1;

        var cardDiv = document.getElementById(currentProblemDifficultyLevel)

        while (ctr <= Math.min(5, totalNoProb)) {
            checks += 1;
            // Sometimes there may not be even 2 problems with the desired rating requirement, so we have to break the loop forcefully
            if (checks > 1000 * totalNoProb) {
                break;
            }

            // Generate a random index for a problemset problem
            var idx = Math.floor(Math.random() * totalNoProb);
            
            if (!setOfProb.has(idx) && completeProblemSet[idx]["rating"] <= high && completeProblemSet[idx]["rating"] >= low) {
                if (ctr == 1) {
                    // Only print the heading if at least 1 problem of that rating is found in the problemset!
                    var heading = '<h2 class="recommend"><u>' + currentProblemDifficultyLevel + '</u>:</h2>';
                    cardDiv.innerHTML += heading;
                }
                var problemUrl = getProblemUrl + completeProblemSet[idx].contestId.toString() + "/problem/" + completeProblemSet[idx].index;
                var problemName = completeProblemSet[idx].name;

                cardDiv.innerHTML += "<p>" + ctr + ". </p>" + "<a href=" + problemUrl + " target=_blank>" + problemName + "</a>" + "<p> (" + completeProblemSet[idx].rating + ")</p><br>";
                setOfProb.add(idx);
                ctr++;
            }
        }
    }
}


function drawChart(userAcceptedTags) {
    document.getElementById('tags').classList.remove('hidden');
    var tagTable = [];
    for (var tag in userAcceptedTags) {
        tagTable.push([tag + ": " + userAcceptedTags[tag], userAcceptedTags[tag]]);
    }
    tagTable.sort(function (a, b) {
        return b[1] - a[1];
    });

    let tags = new google.visualization.DataTable();

    tags.addColumn('string', 'Tag');
    tags.addColumn('number', 'solved');
    tags.addRows(tagTable); // important to add the rows after the columns are defined

    var tagOptions = {
        width: document.getElementById('tags').width,
        height: document.getElementById('tags').height,
        chartArea: { width: '100%', height: '100%' },
        pieSliceText: 'none',
        legend: {
            position: 'right',
            alignment: 'center',
            textStyle: {
                fontSize: 12,
                fontName: 'Nunito',
                color: '#bbbbbb'
            }
        },
        pieHole: 0.5,
        tooltip: {
            text: 'percentage'
        },
        fontName: 'Nunito',
        backgroundColor: '#292929',
        color: '#bbbbbb',
        colors: googleChartColors.slice(0, Math.min(googleChartColors.length, tags.getNumberOfRows())),
    };
    var tagChart = new google.visualization.PieChart(document.getElementById('tags'));
    tagChart.draw(tags, tagOptions);
}


window.addEventListener("load", function () {
    document.getElementById("handle-form").onsubmit = (async function (event) {
        event.preventDefault();
        resetPage();
        var handle = document.getElementById("handle-input").value;

        let [userExists, userSubmissions, problemsetData, userInfoData, contestsData] = await fetchDataFromCodeforcesAPI(handle);
        console.log(userExists);

        if (!userExists) {
            document.getElementById('display_block').style.display = "none";
            document.getElementById('chart').style.visibility = "hidden";
            document.getElementById('alert_message').style.display = "block";
            document.getElementById('nocontests').style.display = "block";
            return false;
        } else {
            document.getElementById('alert_message').style.display = "none";
            document.getElementById('display_block').style.display = "block";
        }

        contestList = contestsData.reverse();

        document.getElementById('handle_display').innerHTML = handle;
        document.getElementById('contest_display').innerHTML = contestList.length;
        document.getElementById('recm_handle').innerHTML = handle;
        document.getElementById('nocontests').style.display = "none";
        document.getElementById('chart').style.display = "block";

    
        if (contestList.length == 0) {
            document.getElementById('nocontests').style.display = "block";
            document.getElementById('chart').style.display = "none";
        }

        // computing the rating based on last 5 contest performances
        for (var i = 0; i < Math.min(5, contestList.length); i++) {
            estimatedUserRating += contestList[i].newRating;
        }

        if (contestList.length != 0) {
            estimatedUserRating /= Math.min(5, contestList.length);
        }

        estimatedUserRating = Math.round(estimatedUserRating);

        var userAttemptedProblems = getAttemptedProblems(userSubmissions);
        var userAcceptedTags = parseSubmissionsIntoTags(userSubmissions);

        displayProblemCards(problemsetData["problems"], userAttemptedProblems);
        displayUserProfile(userInfoData, contestList);
        drawChart(userAcceptedTags);
        displayContests(handle, contestList);
    });
}, false);