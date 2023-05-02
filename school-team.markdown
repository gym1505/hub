---
layout: page
title: Сборная гимназии 1505
title_header: Сборная
permalink: /team
---

{% assign cfhandles="" %}

{% for person in site.data.team-handles %}
    {% assign cfhandles = cfhandles | append: person.handle | append: ";" %}
{% endfor %}

{% for person in site.data.team-handles %}
  {% include card.html cfhandle=person.handle name=person.name status=person.status %}
{% endfor %}

{% include load-ratings.html cfhandles=cfhandles %}
