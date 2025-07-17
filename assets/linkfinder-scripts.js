// eslint-disable-next-line no-unused-vars
class linkfinder_hyperlink
{
  link_elem_original = '';

  link_elem_type = '';

  link_elem_before_url = '';

  link_elem_after_url = '';

  link_elem_url_attr = '';

  link_elem_url_value = '';
}

// eslint-disable-next-line no-unused-vars
class linkfinder_linkinfo
{
  post_title = '';

  post_name = '';

  post_type = '';

  post_status = '';

  /**
   * @type {linkfinder_hyperlink[]}
   */
  hyperlinks = [];
}

($ =>
{
  const linkfinder_trim = str => str.replace(/([\s\t\v\0\r]|\r?\n)+/gu, ' ').trim();

  const sort_element = e =>
  {
    let $th = $(e.target);
    const i = $th.index();
    const $table = $th.parents('table').first();
    $th = $table.find(`th:nth-child(${i + 1})`);

    const $sort_elem = $table.find('tbody>tr');
    const order = $th.hasClass('linkfinder-sorted-asc') ? 'DESC' : 'ASC';

    $th.add($th.siblings()).removeClass(['linkfinder-sorted-asc', 'linkfinder-sorted-desc']);
    $th.addClass(`linkfinder-sorted-${order.toLowerCase()}`);

    const do_sort = (a, b) =>
    {
      const text_a = $(a).find('td').eq(i).text();
      const text_b = $(b).find('td').eq(i).text();

      return text_a.localeCompare(text_b, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    };

    $sort_elem.get()
      .sort((a, b) => order === 'DESC' ? do_sort(b, a) : do_sort(a, b))
      .forEach(cur_elem => $(cur_elem).parent().append(cur_elem));
  };

  $(() =>
  {
    $('th.linkfinder-sortable').on('click', sort_element);
  });

  let total_count = 0;
  let links_processed = 0;
  let potential_errors = 0;
  let potential_warnings = 0;
  let potential_other = 0;

  /**
   *
   * @param {string} home_url
   * @param {string} admin_url
   * @param {string} validator_url
   * @param {string|number} postid
   * @param {linkfinder_linkinfo} linkinfo
   * @param {number} index
   * @param {linkfinder_hyperlink} hyperlink
   * @param {string} link_to_validate
   * @param {JQuery.jqXHR<any>|{}|null} jqXHR
   * @param {string|null} errorThrown
   * @param {string|null} internal_link
   */
  const print_link_row = (
    home_url,
    admin_url,
    validator_url,
    postid,
    linkinfo,
    index,
    hyperlink,
    link_to_validate,
    jqXHR,
    errorThrown,
    internal_link = null,
  ) =>
  {
    // eslint-disable-next-line no-param-reassign
    home_url = home_url.replace(/\/*$/u, '');
    // eslint-disable-next-line no-param-reassign
    admin_url = admin_url.replace(/\/*$/u, '');

    // if (jqXHR.status < 200 || jqXHR.status >= 300) // print_link_row() is only triggered when 'true' ..
    const $tr = $('<tr/>');

    const $td_code = $('<td/>');
    $td_code.text(`${jqXHR.status} ${errorThrown}`);

    const $a_edit = $('<a/>');
    $a_edit
      .attr('href', `${admin_url}/post.php?post=${postid}&action=edit`)
      .attr('target', '_blank')
      .text(linkinfo.post_title);

    const $td_post_title = $('<td/>');
    $td_post_title.append($a_edit);

    const $td_post_type = $('<td/>');
    $td_post_type.text(linkinfo.post_type);

    const $td_post_status = $('<td/>');
    $td_post_status.text(linkinfo.post_status);

    const elem_txt = linkfinder_trim(hyperlink.link_elem_type);
    const attr_txt = linkfinder_trim(hyperlink.link_elem_url_attr);
    const $td_link_elem = $('<td/>');
    $td_link_elem.text(`<${elem_txt} ${attr_txt}=`);

    const $oldlink_elem_input_hidden = $('<input/>');
    $oldlink_elem_input_hidden
      .attr('type', 'hidden')
      .attr('name', `oldlink_elem-${postid}-${index}`)
      .val(linkfinder_trim(hyperlink.link_elem_original));

    const $a_link = $('<a/>');
    $a_link
      .attr('href', link_to_validate)
      .attr('target', '_blank')
      .text(linkfinder_trim(hyperlink.link_elem_url_value));

    const $td_link = $('<td/>');
    $td_link.append($a_link);

    const $a_copy = $('<a/>');

    const $newlink_input = $('<input/>');
    $newlink_input
      .attr('type', 'text')
      .addClass('regular-text')
      .attr('name', `newlink-${postid}-${index}`)
      .attr('placeholder', window.translations.dont_change)
      .on('change', () =>
      {
        if ($newlink_input.val())
        {
          // TODO: Add an additional "pre-submit" ajax check for the provided new link ..
          $tr.addClass('linkfinder-resolved');
          $a_copy.text('X');
        }
        else
        {
          $tr.removeClass('linkfinder-resolved');
          $a_copy.text('>>');
        }
      });

    const $td_newlink = $('<td/>');
    $td_newlink
      .append($oldlink_elem_input_hidden, $newlink_input);

    $a_copy
      .text('>>')
      .attr('title', window.translations.follow_link)
      .on('click', () =>
      {
        if ($a_copy.hasClass('linkfinder-loader'))
        {
          return;
        }

        if ($newlink_input.val())
        {
          $newlink_input.val('');

          $tr.removeClass('linkfinder-resolved');
          $a_copy.text('>>');

          return;
        }

        $a_copy
          .html('<div/>')
          .addClass('linkfinder-loader');

        $.ajax({
          url: validator_url,
          method: 'POST',
          data: {
            link: link_to_validate,
            follow: true,
          },
          cache: false,
          timeout: 0,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
          },
          // crossDomain: !internal_link,
          dataType: 'json',
          success: data =>
          {
            if (data.success)
            {
              $newlink_input.val(data.data.effective_url);
            }
            else
            {
              $newlink_input.val($a_link.text());
            }
          },
          error: () =>
          {
            $newlink_input.val($a_link.text());
          },
          complete: () =>
          {
            $tr.addClass('linkfinder-resolved');
            $a_copy
              .text('X')
              .removeClass('linkfinder-loader');
          },
        });
      });

    const $td_copylink = $('<td/>');
    $td_copylink
      .css('width', '3ch')
      .css('text-align', 'center')
      .append($a_copy);

    $tr.append($td_code, $td_post_title, $td_post_type, $td_post_status, $td_link_elem, $td_link, $td_copylink, $td_newlink);

    if (jqXHR.status >= 400 && jqXHR.status < 600)
    {
      potential_errors++;
      $('span.linkfinder-error-count').text(potential_errors);

      $tr.addClass('linkfinder-tr-error');
    }
    else if (linkinfo.post_status === 'publish' && ((internal_link === null || internal_link === true) || (jqXHR.status >= 300 && jqXHR.status < 400)))
    {
      potential_warnings++;
      $('span.linkfinder-warning-count').text(potential_warnings);

      $tr.addClass('linkfinder-tr-warning');
    }
    else
    {
      potential_other++;
      $('span.linkfinder-other-count').text(potential_other);
    }

    $('table#linkfinder-table>tbody').append($tr);
  };

  /**
   *
   * @param {Object.<string, linkfinder_linkinfo>} postid_hyperlinks
   * @param {string} home_url
   * @param {string} admin_url
   * @param {string} validator_url
   */
  window.linkfinder_process_links = (postid_hyperlinks, home_url, admin_url, validator_url) =>
  {
    // eslint-disable-next-line no-param-reassign
    home_url = home_url.replace(/\/*$/u, '');
    // eslint-disable-next-line no-param-reassign
    admin_url = admin_url.replace(/\/*$/u, '');

    $.each(postid_hyperlinks, (postid, linkinfo) =>
    {
      total_count += linkinfo.hyperlinks.length;
    });

    if (total_count)
    {
      $('span.linkfinder-total-percentage').text('0%');
      $('span.linkfinder-total-count').text(`0/${total_count}`);
    }

    $.each(postid_hyperlinks, (postid, linkinfo) =>
    {
      // eslint-disable-next-line consistent-return
      $.each(linkinfo.hyperlinks, (index, hyperlink) =>
      {
        let link_to_validate = linkfinder_trim(hyperlink.link_elem_url_value);

        if (!link_to_validate || /^(mailto|tel):/iu.test(link_to_validate))
        {
          links_processed++;
          $('span.linkfinder-total-percentage').text(`${Math.round(links_processed / total_count * 100)}%`);
          $('span.linkfinder-total-count').text(`${links_processed}/${total_count}`);

          if (!link_to_validate)
          {
            print_link_row(
              home_url,
              admin_url,
              validator_url,
              postid,
              linkinfo,
              index,
              hyperlink,
              '',
              { status: 0 },
              'Empty link',
            );
          }

          return true;
        }

        let internal_link = false;

        // Check if the hostname of the link is from the same website, if so, it is an internal link.
        internal_link = link_to_validate.replace(/^(https?:\/\/)?(www.?\.)?/iu, '').indexOf(new URL(home_url).hostname.replace(/^www.?\./iu, '')) === 0;

        // Check if the link has a protocol.
        let has_protocol = true;

        try
        {
          // eslint-disable-next-line no-unused-expressions
          new URL(link_to_validate).protocol;
        }
        catch
        {
          has_protocol = false;
        }

        // If link has no protocol, it is expected to be an internal link as well.
        if (!has_protocol && !/^www.?\./iu.test(link_to_validate))
        {
          internal_link = true;

          // Path is absolute ..
          if (link_to_validate.indexOf('/') === 0)
          {
            try
            {
              link_to_validate = new URL(link_to_validate, home_url).href;
            }
            catch
            {
              link_to_validate = home_url + link_to_validate;
            }
          }

          // Path is relative ..
          else
          {
            try
            {
              link_to_validate = new URL(`${linkinfo.post_name}/${link_to_validate}`, home_url).href;
            }
            catch
            {
              link_to_validate = `${home_url}/${linkinfo.post_name}/${link_to_validate}`;
            }
          }
        }

        // Ignore link if it is an admin url.
        if (link_to_validate.replace(home_url, '').indexOf(new URL(admin_url).pathname) === 0)
        {
          links_processed++;
          $('span.linkfinder-total-percentage').text(`${Math.round(links_processed / total_count * 100)}%`);
          $('span.linkfinder-total-count').text(`${links_processed}/${total_count}`);

          return true;
        }

        // OVERRIDE !!
        // internal_link = false

        // TODO: In chunks of 10 or 20 links to prevent server overload ..
        $.ajax({
          url: validator_url, // internal_link ? link_to_validate : validator_url,
          method: 'POST',
          data: {
            link: link_to_validate,
          },
          cache: false,
          timeout: 0,
          headers: {
            // 'Referer': home_url,
            // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
          },
          // crossDomain: !internal_link,
          // dataType: 'json',
          error: (jqXHR, _, errorThrown) =>
          {
            print_link_row(
              home_url,
              admin_url,
              validator_url,
              postid,
              linkinfo,
              index,
              hyperlink,
              link_to_validate,
              jqXHR,
              errorThrown,
              internal_link,
            );
          },
          complete: () =>
          {
            links_processed++;
            $('span.linkfinder-total-percentage').text(`${Math.round(links_processed / total_count * 100)}%`);
            $('span.linkfinder-total-count').text(`${links_processed}/${total_count}`);
          },
        });
      });
    });
  };

  /**
   *
   * @param {string} type
   * @param {boolean} show
   */
  window.linkfinder_row_filter = (type, show) =>
  {
    let className = '';

    switch (type)
    {
      case 'errors':
        className = 'linkfinder-hide-errors';

        break;

      case 'warnings':
        className = 'linkfinder-hide-warnings';

        break;

      case 'other':
        className = 'linkfinder-hide-other';

        break;
    }

    const $table = $('table#linkfinder-table');

    if (show)
    {
      $table.removeClass(className);
    }
    else
    {
      $table.addClass(className);
    }
  };
})(jQuery);