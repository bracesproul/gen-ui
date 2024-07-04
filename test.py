from codeinterpreterapi import CodeInterpreterSession, settings


# create a session and close it automatically
with CodeInterpreterSession() as session:
    # generate a response based on user input
    response = session.generate_response(
        "Plot the bitcoin chart of year 2023"
    )
    # output the response
    response.show()