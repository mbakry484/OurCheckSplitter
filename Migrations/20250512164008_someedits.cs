using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OurCheckSplitter.Api.Migrations
{
    /// <inheritdoc />
    public partial class someedits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends");

            migrationBuilder.DropColumn(
                name: "FriendId",
                table: "Receipts");

            migrationBuilder.AlterColumn<int>(
                name: "ReceiptId",
                table: "Friends",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Friends",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends");

            migrationBuilder.AddColumn<int>(
                name: "FriendId",
                table: "Receipts",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "ReceiptId",
                table: "Friends",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Friends",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id");
        }
    }
}
