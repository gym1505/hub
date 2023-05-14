var contestList;
const baseApiUrl = "https://codeforces.com/api/";
var problemsDiv = 'none';
var rating = 'none';
var ptags = [];
var levels = [];
var handle = 'none';
var estimatedUserRating = 0;


// Google Charts embed constants
var tags = {};
google.charts.load('current', { 'packages': ['corechart', 'calendar'] });

var googleChartColors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#2196F3', '#009688',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B', '#E65100',
    '#827717', '#004D40', '#1A237E', '#6200EA', '#3F51B5', '#F50057', '#304FFE', '#b71c1c'];


function findControlElements() {
    problemsDiv = document.getElementById("problems");
    rating = document.getElementById("rank_display");
}


function resetPage() {
    $('#handle_display').text(handle)
    $('#Easy').text('')
    $('#Medium').text('')
    $('#Hard').text('')

    problemsDiv.innerHTML = '';
    estimatedUserRating = 0;
    tags = {};

    $('#rank_display').text("");
    $('#max_rating_display').text("");
    $('#max_rank_display').text("");
    $('#current_rank_display').text("");
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
    $.get('https://codeforces.com/api/contest.standings', { 'handles': handle, 'contestId': contestId, 'showUnofficial': true, 'lang': 'ru'})
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
            displayProblemsInContest(contestId)
        })
}


function outputContestList() {
    var x, count = 0;
    $('#contestlist *').remove()
    for (x of contestList) {
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


function alertMessageAndResetProblems(msg) {
    alert(msg);
    problemsDiv.innerHTML = '';
}


function createTagCountMapping() {
    var user_prob_set = [];
    ptags = [];

    // Get list of all problems attempted by user
    // Here, attempted problems also include those which are still unsolved
    $.get(baseApiUrl + "user.status", { 'handle': handle }, function (data, status) {
        var status1 = data["status"];
        if (status != "success" || status1 != "OK") {
            alertMessageAndResetProblems("Проверьте подключение к интернету!");
            return;
        }
        var res = data.result;
        for (var i = 0; i < res.length; i++) {
            if (user_prob_set.includes(res[i].problem.contestId + "_" + res[i].problem.name)) continue;
            user_prob_set.push(res[i].problem.contestId + "_" + res[i].problem.name); // Array of attempted problems, with problems defined as 'contestId + NameOfProb'
            var probtag = res[i].problem.tags; // All tags associated with the problem
            for (var t = 0; t < probtag.length; t++) {
                if (!ptags.includes(probtag[t])) {
                    ptags.push(probtag[t]);
                }   // Array containing unique tags attempted by the user

                //  Tags of accepted problem
                if (res[i].verdict == 'OK') {
                    if (tags[probtag[t]] === undefined) tags[probtag[t]] = 1;
                    else tags[probtag[t]]++;
                }
            }
        }
        if (typeof google.visualization === 'undefined') {
            google.charts.setOnLoadCallback(drawChart);
        } else {
            drawChart();
        }
        displayUserStatisticsAndProblems(ptags, user_prob_set);
    });
}


function capitalize(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}


function displayUserStatisticsAndProblems(ptags, user_prob_set) {
    // Function which takes the set of attempted problems, and all the unique tags of problems attempted by user
    $.get(baseApiUrl + "user.info", { 'handles': handle , 'lang': 'ru'})
        .done(function (data, status) {
            var status1 = data["status"];
            if (status != "success" || status1 != "OK") {
                alertMessageAndResetProblems("Проверьте подключение к интернету!");
                return;
            }

            // Gets user rating
            var curr_rating = data.result[0]["rating"];
            var curr_rank = data.result[0]["rank"];
            var maxRating = data.result[0]["maxRating"];
            var max_rank = data.result[0]["maxRank"];
            rating.innerHTML = '';

            var rating_color = {"не в рейтинге": 'white',
                                "новичок": 'gray',
                                "ученик": 'green',
                                "специалист": '#03a89e',
                                "эксперт": 'blue',
                                "кандидат в мастера": 'violet',
                                "мастер": 'orange',
                                "международный мастер": 'orange',
                                "гроссмейстер": 'red',
                                "международный гроссмейстер": 'red',
                                "легендарный гроссмейстер": 'red'};

            if (contestList.length == 0) {
                $('#rank_display').css('color', 'white').text("N/A");
                $('#max_rating_display').css('color', 'white').text("N/A");
                $('#max_rank_display').css('color', 'white').text("");
                $('#current_rank_display').css('color', 'white').text("(не в рейтинге)");
            } else {
                $('#rank_display').css('color', rating_color[curr_rank]).text(curr_rating);
                $('#max_rating_display').css('color', rating_color[max_rank]).text(maxRating);
                $('#max_rank_display').css('color', rating_color[max_rank]).text("(" + capitalize(max_rank) + ")");
                $('#current_rank_display').css('color', rating_color[curr_rank]).text("(" + capitalize(curr_rank) + ")");
            }

            // if the user is new, we define beginner tags and give him a current rating of 800 to give problems 
            if (ptags.length == 0 || curr_rating < 800 || curr_rating == undefined) {
                ptags = ["math", "greedy", "sortings", "brute force", "implementation"];
                curr_rating = 800;
                estimatedUserRating = 800;
            }

            outputProblemCards(curr_rating, user_prob_set);
        })
        .fail(function (data, status) {
            // If it fails due to too frequent calls to the API (error 429), again call it
            displayUserStatisticsAndProblems(ptags, user_prob_set)
        });
}


function outputProblemCards(rating, usersubmits) {
    // Function to print recommended problems of all tags
    $.get(baseApiUrl + "problemset.problems")
        .done(function (data, status) {
            var status1 = data["status"];
            if (status != "success" || status1 != "OK") {
                alertMessageAndResetProblems("Проверьте подключение к интернету!");
                return;
            }
            var pset = data.result.problems;
            // A precautionary check, since we only pass those tags which the user has attempted, thus being sure that the tag itself exists!
            if (pset.length == 0) {
                alertMessageAndResetProblems("Нет рекомендованных задач");
                return;
            }
            
            var total_no_prob = pset.length;
            var set_of_prob = new Set(); // To store and search the problems being recommended
            var get_prob_url = "https://codeforces.com/contest/";
            var not_attempted_prob = [];

            // Creates array of problems, of the tag provided in input, NOT attempted by the user
            for (var i = 0; i < total_no_prob; i++) {
                if (!usersubmits.includes(pset[i].contestId + "_" + pset[i].name)) not_attempted_prob.push(pset[i]);
            }

            pset = not_attempted_prob; // Modifies pset to contain only those problems NOT attempted by the user
            total_no_prob = pset.length;

            level = ["Easy", "Medium", "Hard"];

            var round_rating = estimatedUserRating % 100
            if (round_rating < 50) round_rating = estimatedUserRating - round_rating;
            else round_rating = estimatedUserRating + 100 - round_rating;

            for (var index in level) {
                var low, high;
                if (index == 0) {
                    low = easyLow(round_rating) + round_rating;
                    high = easyHigh(round_rating) + round_rating;
                }
                else if (index == 1) {
                    low = mediumLow(round_rating) + round_rating;
                    high = mediumHigh(round_rating) + round_rating;
                }
                else {
                    low = hardLow(round_rating) + round_rating;
                    high = hardHigh(round_rating) + round_rating;
                }

                // Generate five random problems
                var checks = 0;
                var ctr = 1;

                var card_div = document.getElementById(level[index])

                while (ctr <= Math.min(5, total_no_prob)) {
                    checks += 1;
                    // Sometimes, there may not be even 2 problems with the desired rating requirement, so we have to break the loop forcefully
                    if (checks > 1000 * total_no_prob) {
                        break;
                    }
                    // Generate a random index
                    var idx = Math.floor(Math.random() * total_no_prob);
                    if (!set_of_prob.has(idx) && pset[idx]["rating"] <= high && pset[idx]["rating"] >= low) {
                        if (ctr == 1) {
                            // Only print the heading if at least 1 problem of that rating is found in the problemset!
                            var heading = '<h2 class="recommend"><u>' + level[index] + '</u>:</h2>';
                            card_div.innerHTML += heading;
                        }
                        var problem_url = get_prob_url + pset[idx].contestId.toString() + "/problem/" + pset[idx].index;
                        var problem_name = pset[idx].name;

                        card_div.innerHTML += "<p>" + ctr + ". </p>" + "<a href=" + problem_url + " target=_blank>" + problem_name + "</a>" + "<p> (" + pset[idx].rating + ")</p><br>";
                        set_of_prob.add(idx);
                        ctr++;
                    }
                }
            }
        })
        .fail(function (data, status) {
            // If it fails due to too frequent calls to the API (error 429), call it again
            outputProblemCards(rating, usersubmits)
        });
}


function drawChart() {
    $('#tags').removeClass('hidden');
    var tagTable = [];
    for (var tag in tags) {
        tagTable.push([tag + ": " + tags[tag], tags[tag]]);
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
                fontSize: 10,
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
    findControlElements();

    $('.form-control').keypress(function (e) {
        if (e.which == 13) {
          $('form.form-group').submit();
          return false;
        }
    });

    $('form.form-group').on("submit", function (event) {
        resetPage();
        handle = $('#handle_inp').val()
        $.get(baseApiUrl + "user.rating", { 'handle': handle })
            .done(function (data, status) {
                contestList = data.result.reverse()

                $('#alert_message').hide();
                $('#display_block').show();
                $('#handle_display').text(handle)
                $('#contest_display').text(contestList.length)
                $('#recm_handle').text(handle)
                $('#nocontests').hide()
                $('#chart').show()
                $('#chart_error').hide()

                if (contestList.length == 0) {
                    $('#recent_contests').text("Вы еще не участвовали в рейтинговых контестах!")
                    $('#nocontests').show()
                    $('#chart').hide()
                    $('#chart_error').show()
                } else $('#recent_contests').text("")

                for (var i = 0; i < Math.min(5, contestList.length); i++) {
                    estimatedUserRating += contestList[i].newRating;
                }

                if (contestList.length != 0) {
                    estimatedUserRating /= Math.min(5, contestList.length);
                }

                estimatedUserRating = Math.round(estimatedUserRating);

                createTagCountMapping();
                outputContestList();
            })
            .fail(function (data, status) {
                $('#display_block').hide();
                $('#alert_message').show();
            })

        event.preventDefault();
    });
});