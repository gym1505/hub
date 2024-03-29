---
layout: page
title: Полезные технологии
title_header: Технологии
permalink: /methods
---

## **Для всех**

#### Markdown

Markdown - универсальный язык разметки текста. В нем есть почти все возможности HTML, поддержка ссылок, формул и других штук. Этот сайт изнутри написан на Markdown, потому что таким образом не надо писать HTML и CSS вручную.

Очень рекомендую изучить Markdown, потому что это займет у вас полчаса, а вы приобретете крутой навык, применимый для ведения заметок, оформления документов и создания сайтов.

[Руководство по Markdown на русском](https://paulradzkov.com/2014/markdown_cheatsheet/)

#### Статические сайты

Статические сайты не содержат серверной стороны - они работают исключительно в браузере. Их удобство в том, что их можно бесплатно хостить на GitHub. Для создания статических сайтов на Markdown рекомендую использовать [Jekyll](https://jekyllrb.com) или [Hugo](gohugo.io) - это программы, которые из ваших текстовых файлов на Markdown генерируют красивый сайт вроде этого.

#### LaTeX

$$\LaTeX$$ - язык разметки математических, физических и химических формул. Его довольно просто выучить и использовать. Например, можно быстро создавать такие формулы:

$$\sum_{i = 0}^n{\frac{i}{k}} = \frac{\sum_{i = 0}^n{i}}{k}$$

$$H^+ + OH^- = H_2O$$

[Крутая инструкция по LaTeX](https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes)

## **Для организаторов соревнований**

> 🔥 **Совет:** Если вы хотите сделать контест для нескольких человек и вам не принципиальна независимость от сторонних сервисов, используйте [мэшапы на Codeforces](https://codeforces.com/mashups). Там все доступно и понятно, и вы можете использовать собственные задачи! Разворачивайте ejudge только в самых крайних случаях.

#### Polygon

[Polygon](https://polygon.codeforces.com) - единственный хороший способ создавать задачи по спортивному программированию. Именно там сделано большинство задач из Codeforces.

Если вы поняли, что готовы сами писать задачи - дерзайте! Сервис бесплатный, общедоступный и работает на поддомене Codeforces.

#### Настройка и использование ejudge

[ejudge](https://ejudge.ru/wiki/index.php/%D0%A1%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D0%B0_ejudge) - официальная тестирующая система Всероссийской олимпиады школьников по информатике, МОШ по информатике и других олимпиад.

Систему рекомендую устанавливать на Fedora или Ubuntu, с ними меньше всего проблем при установке.

[Официальное руководство по установке на Fedora](https://ejudge.ru/wiki/index.php/%D0%98%D0%BD%D1%81%D1%82%D0%B0%D0%BB%D0%BB%D1%8F%D1%86%D0%B8%D1%8F_ejudge_3.9.2%2B_%D0%BD%D0%B0_Fedora_34%2B_%D1%81_%D0%BD%D1%83%D0%BB%D1%8F)

Чтобы посылки тестировались, необходимо изолировать процессы в контейнерах. Насколько я знаю, это действие критично для работы системы.

[Обязательная настройка на Fedora (изоляция в контейнерах)](https://ejudge.ru/wiki/index.php/%D0%98%D0%B7%D0%BE%D0%BB%D1%8F%D1%86%D0%B8%D1%8F_%D0%BD%D0%B5%D0%B4%D0%BE%D0%B2%D0%B5%D1%80%D0%B5%D0%BD%D0%BD%D1%8B%D1%85_%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D1%81%D1%81%D0%BE%D0%B2_%D0%B2_%D0%BA%D0%BE%D0%BD%D1%82%D0%B5%D0%B9%D0%BD%D0%B5%D1%80%D0%B0%D1%85)

Если необходима повышенная безопасность, необходимо поставить [патч к ядру](https://ejudge.ru/wiki/index.php/%D0%9F%D0%B0%D1%82%D1%87_%D0%BA_%D1%8F%D0%B4%D1%80%D1%83_Linux), чтобы всю систему нельзя было положить одной [форкбомбой](https://ru.wikipedia.org/wiki/Fork-%D0%B1%D0%BE%D0%BC%D0%B1%D0%B0) на Bash или C++. В своем ejudge я этот патч не ставил, но рекомендую это сделать.

Если возникают ошибки, которые не получается исправить, есть [чатик в телеге](https://t.me/ejudgegeneral).

#### Полезные скрипты для ejudge/Polygon

- [polygon-to-ejudge](https://github.com/grphil/polygon-to-ejudge) - перегоняет задачи из Polygon в ejudge лучше, чем стандартная утилита
- [polygon-cli](https://github.com/kunyavskiy/polygon-cli) - инструмент для доступа к Polygon из терминала
