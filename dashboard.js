/**
 * Created by Shauro on 15/12/10.
 */

function renderBusinessList(businessList) {
  var tbodySelection = d3.select('#business-list').select('tbody');
  tbodySelection.selectAll('*').remove();
  var trSelection = tbodySelection.selectAll('tr').data(businessList);
  trSelection.enter().append('tr');
  trSelection.exit().remove();
  var tdSelection = trSelection
    .append('td')
    .text(function (d) {
      return d._source.name;
    });
  tbodySelection
    .select('td:nth-child(1)')
    .classed('text-highlighted', true);
  tdSelection
    .on('mouseover', function (businessName, i) {
      businessListHighlight(i);
      reviewLineChartHighlight(i);
      starLineChartHighlight(i);
    })
    .on('click', function (business, i) {
      businessListClick(i);
      reviewLineChartClick(i);
      starLineChartClick(i);
      window.clickedBusinessID = business._source.business_id;
      get_review_details_within_time_range("yelp", "review1208v3", business._source.business_id, 100, "desc", "2005-01-01", "2014-12-31");
    });
}

//function renderBusinessListReRank(businessList) {//different input format compared with renderBusinessList
//  var trSelection = d3.select('#business-list').select('tbody').selectAll('tr').data(businessList);
//  tbodySelection.selectAll('*').remove();
//  trSelection.enter().append('tr');
//  trSelection.exit().remove();
//  var tdSelection = trSelection
//      .append('td')
//      .text(function (d) {
//        return d.name;
//      });
//  var tbodySelection = d3.select('#business-list').select('tbody');
//  tbodySelection
//      .select('td:nth-child(1)')
//      .classed('text-highlighted', true);
//  tdSelection
//      .on('mouseover', function (businessName, i) {
//        businessListHighlight(i);
//        reviewLineChartHighlight(i);
//      })
//      .on('click', function(businessName, i) {
//        businessListClick(i);
//        reviewLineChartClick(i);
//      });
//}

function renderReviewList(reviewList) {
  var tbodySelection = d3.select('#review-list').select('tbody');
  tbodySelection.selectAll('*').remove();
  var trSelection = tbodySelection.selectAll('tr').data(reviewList);
  trSelection.enter().append('tr');
  trSelection.exit().remove();
  var timeSelection = trSelection
    .append('td')
    .text(function (d) {
      return d._source.date;
    });
  var reviewSelection = trSelection
    .append('td')
    .text(function (d) {
      return d._source.text;
    });
}

function renderLineCharts(lineChartData) {
  drawReviewAmountLineChart(lineChartData);
  drawStarAmountLineChart(lineChartData);
}

function drawReviewAmountLineChart(lineChartData) {
  var reviewContainer = $('#review-amount-line-chart');
  var lineChartHeight = $('#business-list').height() / 2;
  var lineChartWeight = reviewContainer.width();
  reviewContainer.height(lineChartHeight);
  var reviewSelection = d3.select('#review-amount-line-chart');
  reviewSelection.selectAll('*').remove();
  var svgSelection = reviewSelection
    .append('svg')
    .classed('line-chart', true)
    .attr('height', lineChartHeight)
    .attr('width', lineChartWeight);
  var mindate = new Date(2005, 1, 1);
  var maxdate = new Date(2014, 12, 31);
  var xScale = d3.time.scale().range([
    30,
    lineChartWeight - 30
  ]).domain([mindate, maxdate]);
  var yScale = d3.scale.linear().range([
    lineChartHeight - 30,
    30
  ]).domain([0, 50]);
  var xAxis = d3.svg.axis()
    .scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(yScale).orient('left');
  svgSelection
    .append('svg:g').call(xAxis)
    .classed('axis', true)
    .classed('x', true)
    .attr('transform', 'translate(0, ' + (lineChartHeight - 30) + ')');
  svgSelection
    .append('svg:g').call(yAxis)
    .classed('axis', true)
    .classed('y', true)
    .attr('transform', 'translate(30, 0)');
  var reviewContent = svgSelection.append('g')
    .classed('review-content', true)
    .attr('width', lineChartWeight)
    .attr('height', lineChartHeight);
  var reviewPath = reviewContent.selectAll('path').data(lineChartData);
  var line = d3.svg.line()
    .x(function (data) {
      return xScale(new Date(data.date));
    })
    .y(function (data) {
      return yScale(data.review_amount);
    })
    .interpolate('linear');
  reviewPath.enter().append('path')
    .on('mousemove', function (data, i) {
      businessListHighlight(i);
      reviewLineChartHighlight(i);
      starLineChartHighlight(i);
    })
    .on('click', function (data, i) {
      $('#business-list tbody tr:nth-child(' + (i + 1) + ') td').trigger('click');
    });
  reviewPath.classed('profile', true)
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', '#D8D8D8')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1);
  reviewPath.exit().remove();
  $('#business-list tbody tr:first-child td').trigger('click');

  // Drag Selection.
  var timeLeft = 0;
  var timeRight = 0;
  var drag = d3.behavior.drag()
    .on('drag', function (d, i) {
      var selection = d3.selectAll('.selected');
      if (selection[0].indexOf(this) == -1) {
        selection.classed('selected', false);
        selection = d3.select(this);
        selection.classed('selected', true);
      }
      selection.attr('transform', function (d, i) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        return 'translate(' + [d.x, d.y] + ')';
      });
      this.parentNode.appendChild(this);
      d3.event.sourceEvent.stopPropagation();
    });
  reviewPath.call(drag);
  svgSelection
    .on('mousedown', function () {
      if (!d3.event.ctrlKey) {
        d3.selectAll('path.selected').classed('selected', false);
      }
      var p = d3.mouse(this);
      timeLeft = p[0];
      reviewContent.append('rect')
        .attr({
          rx: 6,
          ry: 6,
          class: 'selection',
          x: p[0],
          y: p[1],
          width: 0,
          height: 0
        });
    })
    .on('mousemove', function () {
      var s = reviewContent.select('rect.selection');
      if (!s.empty()) {
        var p = d3.mouse(this),
          d = {
            x: parseInt(s.attr('x'), 10),
            y: parseInt(s.attr('y'), 10),
            width: parseInt(s.attr('width'), 10),
            height: parseInt(s.attr('height'), 10)
          },
          move = {
            x: p[0] - d.x,
            y: p[1] - d.y
          };
        if (move.x < 1 || (move.x * 2 < d.width)) {
          d.x = p[0];
          d.width -= move.x;
        }
        else {
          d.width = move.x;
        }
        if (move.y < 1 || (move.y * 2 < d.height)) {
          d.y = p[1];
          d.height -= move.y;
        }
        else {
          d.height = move.y;
        }
        s.attr(d);
        // deselect all temporary selected state objects
        reviewContent.selectAll('.selection.selected').classed('selected', false);
        //reviewContent.selectAll('g.state >circle.inner').each( function( state_data, i) {
        //  if(
        //    !d3.select(this).classed('selected') &&
        //      // inner circle inside selection frame
        //    state_data.x-radius>=d.x && state_data.x+radius<=d.x+d.width &&
        //    state_data.y-radius>=d.y && state_data.y+radius<=d.y+d.height
        //  ) {
        //
        //    d3.select( this.parentNode)
        //      .classed( "selection", true)
        //      .classed( "selected", true);
        //  }
        //});
      }
    })
    .on('mouseup', function () {
      reviewContent.selectAll('rect.selection').remove();
      reviewContent.selectAll('.selection').classed('selection', false);
      var p = d3.mouse(this);
      timeRight = p[0];
      var leftDate = xScale.invert(timeLeft);
      var month = leftDate.getMonth() + 1;
      var day = leftDate.getDate();
      var startDate = (1900 + leftDate.getYear()) + '-'
        + (month > 9 ? "" + month: "0" + month) + '-'
        + (day > 9 ? "" + day: "0" + day);
      var rightDate = xScale.invert(timeRight);
      month = rightDate.getMonth() + 1;
      day = rightDate.getDate();
      var endDate = (1900 + rightDate.getYear()) + '-'
        + (month > 9 ? "" + month: "0" + month) + '-'
        + (day > 9 ? "" + day: "0" + day);
      console.log(startDate, endDate);
      console.log(window.clickedBusinessID);
      if (startDate != endDate) {
        get_review_details_within_time_range("yelp", "review1208v3", window.clickedBusinessID, 100, "desc", startDate, endDate);
        get_significant_terms_in_review_details_within_time_range("yelp", "review1208v3", window.clickedBusinessID, 100, startDate, endDate);
      }
    })
    .on('mouseout', function () {
      if (d3.event.relatedTarget.tagName == 'HTML') {
        reviewContent.selectAll('rect.selection').remove();
        reviewContent.selectAll('.selection').classed('selection', false);
      }
    });
}

function drawStarAmountLineChart(lineChartData) {
  var starContainer = $('#star-amount-line-chart');
  var lineChartHeight = $('#business-list').height() / 2;
  var lineChartWeight = starContainer.width();
  starContainer.height(lineChartHeight);
  var starSelection = d3.select('#star-amount-line-chart');
  starSelection.selectAll('*').remove();
  var svgSelection = starSelection
    .append('svg')
    .classed('line-chart', true)
    .attr('height', lineChartHeight)
    .attr('width', lineChartWeight)
    .attr('transform', 'translate(0, ' + lineChartHeight + ')');
  var mindate = new Date(2005, 1, 1);
  var maxdate = new Date(2014, 12, 31);
  var xScale = d3.time.scale().range([
    30,
    lineChartWeight - 30
  ]).domain([mindate, maxdate]);
  var yScale = d3.scale.linear().range([
    lineChartHeight - 30,
    30
  ]).domain([0, 5]);
  var xAxis = d3.svg.axis()
    .scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(yScale).orient('left');
  svgSelection
    .append('svg:g').call(xAxis)
    .classed('axis', true)
    .classed('x', true)
    .attr('transform', 'translate(0, ' + (lineChartHeight - 30) + ')');
  svgSelection
    .append('svg:g').call(yAxis)
    .classed('axis', true)
    .classed('y', true)
    .attr('transform', 'translate(30, 0)');
  var starContent = svgSelection.append('g')
    .classed('star-content', true)
    .attr('width', lineChartWeight)
    .attr('height', lineChartHeight);
  var starPath = starContent.selectAll('path').data(lineChartData);
  var line = d3.svg.line()
    .x(function (data) {
      return xScale(new Date(data.date));
    })
    .y(function (data) {
      return yScale(data.avg_stars);
    })
    .interpolate('linear');
  starPath.enter().append('path')
    .on('mousemove', function (data, i) {
      businessListHighlight(i);
      reviewLineChartHighlight(i);
      starLineChartHighlight(i);
    })
    .on('click', function (data, i) {
      $('#business-list tbody tr:nth-child(' + (i + 1) + ') td').trigger('click');
    });
  starPath.classed('profile', true)
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', '#D8D8D8')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1);
  starPath.exit().remove();
  $('#business-list tbody tr:first-child td').trigger('click');

  // Drag Selection.
  var timeLeft = 0;
  var timeRight = 0;
  var drag = d3.behavior.drag()
    .on('drag', function (d, i) {
      var selection = d3.selectAll('.selected');
      if (selection[0].indexOf(this) == -1) {
        selection.classed('selected', false);
        selection = d3.select(this);
        selection.classed('selected', true);
      }
      selection.attr('transform', function (d, i) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        return 'translate(' + [d.x, d.y] + ')';
      });
      this.parentNode.appendChild(this);
      d3.event.sourceEvent.stopPropagation();
    });
  starPath.call(drag);
  svgSelection
    .on('mousedown', function () {
      if (!d3.event.ctrlKey) {
        d3.selectAll('path.selected').classed('selected', false);
      }
      var p = d3.mouse(this);
      timeLeft = p[0];
      starContent.append('rect')
        .attr({
          rx: 6,
          ry: 6,
          class: 'selection',
          x: p[0],
          y: p[1],
          width: 0,
          height: 0
        });
    })
    .on('mousemove', function () {
      var s = starContent.select('rect.selection');
      if (!s.empty()) {
        var p = d3.mouse(this),
          d = {
            x: parseInt(s.attr('x'), 10),
            y: parseInt(s.attr('y'), 10),
            width: parseInt(s.attr('width'), 10),
            height: parseInt(s.attr('height'), 10)
          },
          move = {
            x: p[0] - d.x,
            y: p[1] - d.y
          };
        if (move.x < 1 || (move.x * 2 < d.width)) {
          d.x = p[0];
          d.width -= move.x;
        }
        else {
          d.width = move.x;
        }
        if (move.y < 1 || (move.y * 2 < d.height)) {
          d.y = p[1];
          d.height -= move.y;
        }
        else {
          d.height = move.y;
        }
        s.attr(d);
        // deselect all temporary selected state objects
        starContent.selectAll('.selection.selected').classed('selected', false);
        //reviewContent.selectAll('g.state >circle.inner').each( function( state_data, i) {
        //  if(
        //    !d3.select(this).classed('selected') &&
        //      // inner circle inside selection frame
        //    state_data.x-radius>=d.x && state_data.x+radius<=d.x+d.width &&
        //    state_data.y-radius>=d.y && state_data.y+radius<=d.y+d.height
        //  ) {
        //
        //    d3.select( this.parentNode)
        //      .classed( "selection", true)
        //      .classed( "selected", true);
        //  }
        //});
      }
    })
    .on('mouseup', function () {
      starContent.selectAll('rect.selection').remove();
      starContent.selectAll('.selection').classed('selection', false);
      var p = d3.mouse(this);
      timeRight = p[0];
      var leftDate = xScale.invert(timeLeft);
      var month = leftDate.getMonth() + 1;
      var day = leftDate.getDate();
      var startDate = (1900 + leftDate.getYear()) + '-'
        + (month > 9 ? "" + month: "0" + month) + '-'
        + (day > 9 ? "" + day: "0" + day);
      var rightDate = xScale.invert(timeRight);
      month = rightDate.getMonth() + 1;
      day = rightDate.getDate();
      var endDate = (1900 + rightDate.getYear()) + '-'
        + (month > 9 ? "" + month: "0" + month) + '-'
        + (day > 9 ? "" + day: "0" + day);
      console.log(startDate, endDate);
      console.log(window.clickedBusinessID);
      if (startDate != endDate) {
        get_review_details_within_time_range("yelp", "review1208v3", window.clickedBusinessID, 100, "desc", startDate, endDate);
        get_significant_terms_in_review_details_within_time_range("yelp", "review1208v3", window.clickedBusinessID, 100, startDate, endDate);
      }
    })
    .on('mouseout', function () {
      if (d3.event.relatedTarget.tagName == 'HTML') {
        reviewContent.selectAll('rect.selection').remove();
        reviewContent.selectAll('.selection').classed('selection', false);
      }
    });
}

function businessListHighlight(index) {
  var tbodySelection = d3.select('#business-list').select('tbody');
  tbodySelection.selectAll('td').classed('text-highlighted', false);
  tbodySelection.select('tr:nth-child(' + (index + 1 ) + ') td').classed('text-highlighted', true);
}

function businessListClick(index) {
  var tbodySelection = d3.select('#business-list').select('tbody');
  tbodySelection.selectAll('td').classed('text-clicked', false);
  tbodySelection.select('tr:nth-child(' + (index + 1 ) + ') td').classed('text-clicked', true);
}

function reviewLineChartHighlight(index) {
  var reviewContent = d3.select('.review-content');
  reviewContent.selectAll('path').classed('path-highlighted', false);
  reviewContent.select('path:nth-child(' + (index + 1 ) + ')').classed('path-highlighted', true);
}

function reviewLineChartClick(index) {
  var reviewContent = d3.select('.review-content');
  reviewContent.selectAll('path').classed('path-clicked', false);
  reviewContent.select('path:nth-child(' + (index + 1 ) + ')').classed('path-clicked', true);
}

function starLineChartHighlight(index) {
  var starContent = d3.select('.star-content');
  starContent.selectAll('path').classed('path-highlighted', false);
  starContent.select('path:nth-child(' + (index + 1 ) + ')').classed('path-highlighted', true);
}

function starLineChartClick(index) {
  var starContent = d3.select('.star-content');
  starContent.selectAll('path').classed('path-clicked', false);
  starContent.select('path:nth-child(' + (index + 1 ) + ')').classed('path-clicked', true);
}

function highlightWordInReview(wordList) {
  //wordList.forEach(function(word, i) {
  var i = 0;
  while (i < wordList.length) {
    if (i >= 10) {
      break;
    }
    var tdSelection = $('#review-list tbody tr td:nth-child(2)');
    //highlight_words(word.key, tdSelection);
    highlight_words(wordList[i].key, tdSelection);
    i++;
  }
  //});
}

function highlight_words(keywords, element) {
  var color = d3.scale.category20().range()
    .concat(d3.scale.category20b().range())
    .concat(d3.scale.category20c().range());
  if(keywords) {
    var textNodes;
    keywords = keywords.replace(/\W/g, '');
    var str = keywords.split(" ");
    $(str).each(function() {
      var term = this;
      var textNodes = element.contents().filter(function() { return this.nodeType === 3 });
      textNodes.each(function() {
        var content = $(this).text();
        var regex = new RegExp(term, "gi");
        content = content.replace(regex, '<span class="review-text-highlighted keyword-' + keywords + '">' + term + '</span>');
        $(this).replaceWith(content);
      });
    });
    var textColor = color[hashString(keywords) % 60];
    $('.keyword-' + keywords).css('color', textColor);
  }
}

function hashString(s) {
  if (typeof s != 'string') {
    return genotet.error('x is not a string to hash');
  }
  var a = 3, p = 1000000007;
  var result = 0;
  for (var i = 0; i < s.length; i++) {
    var x = s.charCodeAt(i);
    result = (result * a + x) % p;
  }
  return result;
}


//Unused code.
//$(document).ready(function () {
//  var client = new $.es.Client({
//    host: 'http://localhost:9200'
//  });
//  client.ping({
//    requestTimeout: 30000 // undocumented params are appended to the query string
//  }, function (error) {
//    if (error) {
//      console.error('elasticsearch cluster is down!');
//    } else {
//      console.log('All is well');
//      var businessList = get_businesses_list_based_on_abnormality_score("yelp", "business1208v3", 10, 1000, "wi", "bars");
//      //get_review_details_within_time_range("yelp", "review1208v3", "g10zmpUzmMJOOIjj_JJPvg, Lml0-yTNsMYsP9IrSMxw9A", 100, "desc", "2012-11-01", "2014-12-01");
//      //get_significant_terms_in_review_details_within_time_range("yelp", "review1208v3", "g10zmpUzmMJOOIjj_JJPvg, Lml0-yTNsMYsP9IrSMxw9A", 100, "2012-11-01", "2014-12-01");
//      //re_rank_in_date_range("yelp", "business1208v3", "2014-01-01", "2014-12-01");
//      //search_box("yelp", 10, "starbucks, money");
//      console.log(businessList);
//
//      //Draw business list.
//      var trSelection = d3.select('#business-list').select('tbody').selectAll('tr').data(businessList);
//      trSelection.enter().append('tr');
//      trSelection.exit().remove();
//      var tdSelection = trSelection.append('td');
//      tdSelection.text(function(d) {
//        return d._source.business_id;
//      });
//      renderLineCharts();
//    }
//  });