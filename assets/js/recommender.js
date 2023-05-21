var contestList;
const baseApiUrl = "https://codeforces.com/api/";
var rating = 'none';
var levels = [];
var handle = 'none';
var estimatedUserRating = 0;


// Google Charts embed constants
var tags = {};
google.charts.load('current', { 'packages': ['corechart', 'calendar'] });

var googleChartColors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#2196F3', '#009688',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B', '#E65100',
    '#827717', '#004D40', '#1A237E', '#6200EA', '#3F51B5', '#F50057', '#304FFE', '#b71c1c'];


function resetPage() {
    $('#handle_display').text(handle)

    $('#Easy').text('')
    $('#Medium').text('')
    $('#Hard').text('')

    $('#rank_display').text("");
    $('#max_rating_display').text("");
    $('#max_rank_display').text("");
    $('#current_rank_display').text("");
    
    $('#alert_message').hide();
    $('#display_block').show();

    estimatedUserRating = 0;
    tags = {};
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
        var problems = data.result.problems;
        var rows = data.result.rows;

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
    x /= 100;
    var low = -21.2 + (25.5 * Math.exp(-0.02 * x));
    low *= 100;
    return low;
}


function easyHigh(x) {
    x /= 100;
    var high = -32.1 + (37.2 * Math.exp(-0.01 * x));
    high *= 100;
    return high;
}


function mediumLow(x) {
    x /= 100;
    var low = -38.8 + (44.8 * Math.exp(-0.008 * x));
    low *= 100;
    return low;
}


function mediumHigh(x) {
    x /= 100;
    var high = -53.2 + (59.9 * Math.exp(-0.005 * x));
    high *= 100;
    return high;
}


function hardLow(x) {
    x /= 100;
    var low = -32.0 + (39.9 * Math.exp(-0.008 * x));
    low *= 100;
    return low;
}


function hardHigh(x) {
    x /= 100;
    var high = -30.8 + (39.6 * Math.exp(-0.006 * x));
    high *= 100;
    return high;
}


function displayProblemsInContest(contestId) {
    $.get(baseApiUrl + "contest.standings", { 'handles': handle, 'contestId': contestId, 'showUnofficial': true, 'lang': 'ru'})
        .done(function (data, status) {
            var contest = new Contest(data)
            for (var x of contest.problems) {
                $('#' + contestId).append('<tr class="' + x.css + '">' +
                    '<td>' + x.index + '</td>' +
                    '<td>' + x.name + '</td>' +
                    '<td>' + x.verdict + '</td>' +
                    '</tr>');
            }
        })
        .fail(function (data, status) {
            displayProblemsInContest(contestId);
        })
}


function displayContests() {
    var count = 0;
    $('#contestlist *').remove()
    for (var x of contestList) {
        if (++count > 3) break;
        $('#contestlist').append(
            '<div class="card">' +
            '<div class="card-body">' +
            '<h4><a href="https://codeforces.com/contest/' + x.contestId + '">' + x.contestName + '</a></h4>' +
            '<table class="table table-bordered">' +
            '<tbody id="' + x.contestId + '">' +
            '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>');
        displayProblemsInContest(x.contestId);
    }
}


function getUserSubmissions(handle) {
    var submissions = null;
    var submissionsUrl = baseApiUrl + "user.status";

    $.ajax({
        url: submissionsUrl,
        data: {
            lang: "ru",
            handle: handle,
        },
        type: 'get',
        dataType: 'json',
        async: false, // critical for the content to load before it is parsed
        success: function(data) {
            submissions = data.result; // unpacking and removing the status
        },
        fail: function(data) {
            getUserSubmissions(handle);
        }
    });

    return submissions;
}


function parseAttemptedProblems(userSubmissions) {
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
    var userAcceptedTags = [];
    var userAttemptedProblems = [];

    for (var i = 0; i < userSubmissions.length; i++) {
        if (userAttemptedProblems.includes(userSubmissions[i].problem.contestId + "_" + userSubmissions[i].problem.name)) continue;
        userAttemptedProblems.push(userSubmissions[i].problem.contestId + "_" + userSubmissions[i].problem.name); // Array of attempted problems, with problems defined as 'contestId_NameOfProb'
        var currentProblemTags = userSubmissions[i].problem.tags; // All tags associated with the problem
        for (var t = 0; t < currentProblemTags.length; t++) {
            if (userSubmissions[i].verdict == 'OK') {
                if (userAcceptedTags[currentProblemTags[t]] === undefined) userAcceptedTags[currentProblemTags[t]] = 1;
                else userAcceptedTags[currentProblemTags[t]]++;
            }
        }
    }

    return userAcceptedTags;
}


function capitalize(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}


function getUserInfo(handle) {
    $.ajax({
        url: baseApiUrl + "user.info",
        data: {'handles': handle, 'lang': 'ru'},
        type: 'get',
        dataType: 'json',
        async: false,
        success: function(data, status) {
            userInformationResponse = data.result;
        },
        fail: function(data, status) {
            userInformationResponse = getUserInfo(handle);
        }
    });

    return userInformationResponse[0]; // берем только первого пользователя из массива длиной 1
}


function displayUserProfile(userInformation) {
    var currentRating = userInformation["rating"];
    var currentRank = userInformation["rank"];
    var maxRating = userInformation["maxRating"];
    var maxRank = userInformation["maxRank"];
    rating.innerHTML = '';

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
        $('#rank_display').css('color', 'white').text("N/A");
        $('#max_rating_display').css('color', 'white').text("N/A");
        $('#max_rank_display').css('color', 'white').text("");
        $('#current_rank_display').css('color', 'white').text("(не в рейтинге)");
    } else {
        $('#rank_display').css('color', rankColorReference[currentRank]).text(currentRating);
        $('#max_rating_display').css('color', rankColorReference[maxRank]).text(maxRating);
        $('#max_rank_display').css('color', rankColorReference[maxRank]).text("(" + capitalize(maxRank) + ")");
        $('#current_rank_display').css('color', rankColorReference[currentRank]).text("(" + capitalize(currentRank) + ")");
    }
}


function getAllArchiveProblems(rating, userSubmits) {
    if (rating < 800 || rating == undefined) {
        rating = 800;
        estimatedUserRating = 800;
    }

    $.ajax({
        url: baseApiUrl + "problemset.problems",
        type: "get",
        dataType: "json",
        async: true,
        success: function(data, status) {
            completeProblemSet = data.result.problems;
            displayProblemCards(completeProblemSet, userSubmits);
        },
        fail: function(data, status) {
            getAllArchiveProblems(rating, userSubmits);
        }
    });
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

    problemDifficultyLevels = ["Easy", "Medium", "Hard"];

    var roundRatingDelta = estimatedUserRating % 100
    if (roundRatingDelta < 50) roundRatingDelta = estimatedUserRating - roundRatingDelta;
    else roundRatingDelta = estimatedUserRating + 100 - roundRatingDelta;

    for (var index in problemDifficultyLevels) {
        var low, high;
        if (index == 0) {
            low = easyLow(roundRatingDelta) + roundRatingDelta;
            high = easyHigh(roundRatingDelta) + roundRatingDelta;
        }
        else if (index == 1) {
            low = mediumLow(roundRatingDelta) + roundRatingDelta;
            high = mediumHigh(roundRatingDelta) + roundRatingDelta;
        }
        else {
            low = hardLow(roundRatingDelta) + roundRatingDelta;
            high = hardHigh(roundRatingDelta) + roundRatingDelta;
        }

        // Generate five random problems
        var checks = 0;
        var ctr = 1;

        var cardDiv = document.getElementById(problemDifficultyLevels[index])

        while (ctr <= Math.min(5, totalNoProb)) {
            checks += 1;
            // Sometimes, there may not be even 2 problems with the desired rating requirement, so we have to break the loop forcefully
            if (checks > 1000 * totalNoProb) {
                break;
            }
            // Generate a random index
            var idx = Math.floor(Math.random() * totalNoProb);
            if (!setOfProb.has(idx) && completeProblemSet[idx]["rating"] <= high && completeProblemSet[idx]["rating"] >= low) {
                if (ctr == 1) {
                    // Only print the heading if at least 1 problem of that rating is found in the problemset!
                    var heading = '<h2 class="recommend"><u>' + problemDifficultyLevels[index] + '</u>:</h2>';
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
    $('#tags').removeClass('hidden');
    var tagTable = [];
    for (var tag in userAcceptedTags) {
        tagTable.push([tag + ": " + userAcceptedTags[tag], userAcceptedTags[tag]]);
    }
    tagTable.sort(function (a, b) {
        return b[1] - a[1];
    });
    tags = new google.visualization.DataTable();
    tags.addColumn('string', 'Tag');
    tags.addColumn('number', 'solved');
    tags.addRows(tagTable);
    var tagOptions = {
        width: $('#tags').width(),
        height: $('#tags').height(),
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


$(document).ready(function () {
    rating = document.getElementById("rank_display");

    $('#handle-input').keypress(function (e) {
        if (e.which == 13) {
          $('#handle-form').submit();
          return false;
        }
    });

    $('#handle-form').on("submit", function (event) {
        resetPage();
        handle = $('#handle-input').val()

        var userExists = false;

        $.ajax({
            url: baseApiUrl + "user.rating",
            data: {"handle": handle},
            type: "get",
            dataType: "json",
            async: false,
            success: function(data) {
                if (data.status == "OK") {
                    contestList = data.result.reverse();
                    userExists = true;
                } else {
                    userExists = false;
                }
            },
            fail: function(data) {
                userExists = false;
            }
        });

        if (!userExists) {
            $('#display_block').hide();
            $('#alert_message').show();
            $('#chart').hide();
            $('#nocontests').show();
            return false;
        } else {
            $('#display_block').show();
            $('#alert_message').hide();
        }

        $('#handle_display').text(handle);
        $('#contest_display').text(contestList.length);
        $('#recm_handle').text(handle);
        $('#nocontests').hide();
        $('#chart').show();

        if (contestList.length == 0) {
            $('#nocontests').show();
            $('#chart').hide();
        }

        for (var i = 0; i < Math.min(5, contestList.length); i++) {
            estimatedUserRating += contestList[i].newRating;
        }

        if (contestList.length != 0) {
            estimatedUserRating /= Math.min(5, contestList.length);
        }

        estimatedUserRating = Math.round(estimatedUserRating);

        var userSubmissions = getUserSubmissions(handle);

        var userAttemptedProblems = parseAttemptedProblems(userSubmissions);
        var userAcceptedTags = parseSubmissionsIntoTags(userSubmissions);

        var completeUserInformation = getUserInfo(handle);

        displayUserProfile(completeUserInformation);
        getAllArchiveProblems(completeUserInformation.rating, userAttemptedProblems);
        drawChart(userAcceptedTags);
        displayContests();

        event.preventDefault();
    });
});