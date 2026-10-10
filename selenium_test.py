from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
import time

BASE = "http://localhost:3000/"
EMAIL = "tester@example.com"
PASSWORD = "Test@1234"

driver = webdriver.Chrome()
wait = WebDriverWait(driver, 10)


def fill(el, text):
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    time.sleep(0.5)
    try:
        el.click()
    except Exception:
        # something (e.g. a toast) is covering the element, click via JavaScript
        driver.execute_script("arguments[0].click(); arguments[0].focus();", el)
    el.send_keys(Keys.CONTROL, "a")
    el.send_keys(text)


def set_value(el, value):
    """Set a field's value and fire the events AngularJS listens for."""
    driver.execute_script(
        "var el = arguments[0];"
        "el.focus();"
        "el.value = arguments[1];"
        "el.dispatchEvent(new Event('input', {bubbles:true}));"
        "el.dispatchEvent(new Event('change', {bubbles:true}));"
        "el.dispatchEvent(new Event('blur', {bubbles:true}));",
        el, str(value))


def select_first_client():
    """Pick the first real client in the dropdown and notify AngularJS."""
    wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "#clientSelect option")) > 1)
    options = driver.find_elements(By.CSS_SELECTOR, "#clientSelect option")
    print("Client options:", [o.text for o in options])
    driver.execute_script(
        "var s = document.getElementById('clientSelect');"
        "for (var i = 0; i < s.options.length; i++) {"
        "  if (s.options[i].text.indexOf('\u2014') !== -1) { s.selectedIndex = i; break; }"
        "}"
        "s.dispatchEvent(new Event('change', {bubbles:true}));")
    time.sleep(1)
    chosen = driver.execute_script(
        "var s = document.getElementById('clientSelect');"
        "return s.options[s.selectedIndex].text;")
    print("Client selected:", chosen)
    assert "Select a client" not in chosen, "Client was not selected"


def scroll_to(el):
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    time.sleep(1)


def login():
    driver.get(BASE + "login.html")
    wait.until(EC.visibility_of_element_located((By.ID, "email")))
    fill(driver.find_element(By.ID, "email"), EMAIL)
    fill(driver.find_element(By.ID, "password"), PASSWORD)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(2)


try:
    driver.maximize_window()
    print("================================")
    print("INVOICEFLOW SELENIUM TEST")
    print("================================")

    # ---------- Test Case 1: Interface Testing (Login page) ----------
    print("\nTest Case 1: Interface Testing")
    driver.get(BASE + "login.html")
    h1 = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
    assert "Log in" in h1.text
    for locator in [(By.ID, "email"), (By.ID, "password"),
                    (By.CSS_SELECTOR, "button[type='submit']"),
                    (By.LINK_TEXT, "Create an account")]:
        assert driver.find_element(*locator).is_displayed(), f"Missing {locator}"
    print("Interface Test Passed")

    # ---------- Test Case 2: Usability Testing ----------
    print("\nTest Case 2: Usability Testing")
    email = driver.find_element(By.ID, "email")
    assert email.get_attribute("placeholder"), "Email has no placeholder"
    assert driver.find_element(By.CSS_SELECTOR, "label[for='email']").is_displayed()
    assert driver.find_element(By.CSS_SELECTOR, "label[for='password']").is_displayed()
    fill(email, "abc")
    err = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "error-msg")))
    assert "valid email" in err.text
    print("Usability Test Passed (labels, placeholders, validation message)")

    # ---------- Test Case 3: Functional Testing (Signup + Login) ----------
    print("\nTest Case 3: Functional Testing (Signup and Login)")
    driver.get(BASE + "signup.html")
    time.sleep(1)
    for inp in driver.find_elements(By.TAG_NAME, "input"):
        if not inp.is_displayed():
            continue
        t = inp.get_attribute("type")
        if t == "email":
            fill(inp, EMAIL)
        elif t == "password":
            fill(inp, PASSWORD)
        elif t == "checkbox":
            if not inp.is_selected():
                inp.click()
        elif t in ("text", None, ""):
            fill(inp, "Test User")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(2)

    if "login.html" in driver.current_url or "signup.html" in driver.current_url:
        login()
    assert "login.html" not in driver.current_url, "Login failed"
    print("Signup/Login Passed, redirected to:", driver.current_url)

    # ---------- Test Case 4: Create Invoice (Interface + Functional) ----------
    print("\nTest Case 4: Create Invoice")
    driver.get(BASE + "create-invoice.html")
    wait.until(EC.visibility_of_element_located((By.ID, "invoiceNumber")))

    for el_id in ["invoiceNumber", "clientSelect", "invoiceDate", "dueDate", "notes"]:
        assert driver.find_element(By.ID, el_id).is_displayed(), f"{el_id} missing"
    print("Create Invoice Interface Passed")

    # choose a client
    select_first_client()

    # add a line item: 2 x 500, 0% tax, 0% discount
    time.sleep(1)
    existing_rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")
    print("Item rows already on page:", len(existing_rows))
    if len(existing_rows) == 0:
        add_btn = driver.find_element(By.CSS_SELECTOR, "[ng-click='vm.addItem()']")
        scroll_to(add_btn)
        add_btn.click()
        time.sleep(1)

    row = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "tbody tr")))
    cells = row.find_elements(By.TAG_NAME, "input")  # desc, qty, price, tax, discount
    set_value(cells[0], "Keyboard")
    set_value(cells[1], "2")
    set_value(cells[2], "500")
    set_value(cells[3], "0")
    set_value(cells[4], "0")
    time.sleep(1)

    # remove any extra blank rows so they don't block saving
    rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")
    for extra in rows[1:]:
        desc = extra.find_elements(By.TAG_NAME, "input")[0]
        if not desc.get_attribute("value"):
            extra.find_element(By.CSS_SELECTOR, "button[ng-click*='removeItem']").click()
            time.sleep(0.5)
    print("Item rows after cleanup:", len(driver.find_elements(By.CSS_SELECTOR, "tbody tr")))

    grand = driver.find_element(By.CSS_SELECTOR, ".totals-grand .figures").text
    print("Grand total shown:", grand)
    assert "1000" in grand.replace(",", ""), f"Wrong total: {grand}"
    print("Functional Test Passed (2 x 500 = 1000)")

    # ---------- Fill remaining fields (notes, dates, signature) ----------
    fill(driver.find_element(By.ID, "notes"), "Payment within 14 days. Thank you.")

    # always set the dates so AngularJS registers a valid date value
    for el_id, value in [("invoiceDate", "2026-10-10"), ("dueDate", "2026-10-24")]:
        field = driver.find_element(By.ID, el_id)
        driver.execute_script(
            "arguments[0].value = arguments[1];"
            "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));"
            "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));",
            field, value)
    time.sleep(1)

    # draw a signature on the canvas
    canvas = driver.find_element(By.ID, "sigPad")
    scroll_to(canvas)
    ActionChains(driver).move_to_element_with_offset(canvas, -100, -20) \
        .click_and_hold().move_by_offset(60, 30).move_by_offset(60, -30) \
        .move_by_offset(60, 30).release().perform()
    time.sleep(1)
    print("Signature drawn")

    # ---------- Preview modal ----------
    preview_btn = driver.find_element(By.CSS_SELECTOR, "[ng-click='vm.openPreview()']")
    scroll_to(preview_btn)
    preview_btn.click()
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".preview-modal")))
    print("Preview Modal Passed")
    driver.find_element(By.CSS_SELECTOR, ".modal-foot button").click()
    time.sleep(1)

    # ---------- Save invoice ----------
    inv_no = driver.find_element(By.ID, "invoiceNumber").get_attribute("value")
    save_btn = driver.find_element(By.CSS_SELECTOR, "[ng-click*='vm.saveInvoice']")
    scroll_to(save_btn)
    save_btn.click()
    time.sleep(2)

    toast = driver.find_element(By.TAG_NAME, "ivf-toast").text
    print("Toast after save:", repr(toast))
    print("URL after save:", driver.current_url)
    errors = [e.text for e in driver.find_elements(By.CSS_SELECTOR, ".error-msg")
              if e.is_displayed()]
    print("Visible validation errors:", errors)
    driver.save_screenshot("after_save.png")

    # which fields does AngularJS consider invalid?
    invalid = driver.execute_script(
        "return Array.from(document.querySelectorAll('input.ng-invalid, select.ng-invalid, textarea.ng-invalid'))"
        ".map(e => e.tagName + ' id=' + e.id + ' name=' + e.name + ' type=' + e.type + ' value=[' + e.value + ']');")
    print("Invalid fields:", invalid)

    # ---------- Verify in invoice history ----------
    driver.get(BASE + "invoice-history.html")
    wait.until(EC.visibility_of_element_located((By.TAG_NAME, "body")))
    time.sleep(2)
    driver.save_screenshot("history.png")
    assert inv_no in driver.page_source, f"{inv_no} not in history (toast: {toast!r})"
    print(f"Save Invoice Passed ({inv_no} found in history)")

    # ---------- Test Case 5: Navigation Testing ----------
    print("\nTest Case 5: Navigation Testing")
    for page in ["clients.html", "templates.html", "settings.html",
                 "invoice-history.html", "create-invoice.html"]:
        driver.get(BASE + page)
        wait.until(EC.visibility_of_element_located((By.TAG_NAME, "body")))
        assert page in driver.current_url, f"Redirected away from {page}"
        print(f"{page} Navigation Passed")

    print("\nAll Selenium tests completed")

finally:
    driver.quit()